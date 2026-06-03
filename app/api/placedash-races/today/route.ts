import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getMelbourneDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getOdds(runner: any, bookmaker: string) {
  return runner.odds?.find((o: any) => o.bookmaker === bookmaker) || null;
}

export async function GET() {
  try {
    const username = process.env.RACING_API_USERNAME;
    const password = process.env.RACING_API_PASSWORD;

    if (!username || !password) {
      return NextResponse.json({
        ok: false,
        error: "Missing RACING_API_USERNAME or RACING_API_PASSWORD",
      });
    }

    const auth = Buffer.from(`${username}:${password}`).toString("base64");
    const today = getMelbourneDate();

    const meetingsRes = await fetch(
      `https://api.theracingapi.com/v1/australia/meets?date=${today}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const meetingsData = await meetingsRes.json();
    const meetings = meetingsData?.meets || meetingsData?.meetings || [];

    const allRaces: any[] = [];

    for (const meet of meetings) {
      const meetId = meet.id || meet.meet_id || meet.meetId;

      if (!meetId) continue;

      const racesRes = await fetch(
        `https://api.theracingapi.com/v1/australia/meets/${meetId}/races`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      const racesData = await racesRes.json();
      const races = racesData?.races || [];

      for (const race of races) {
        const runners = race.runners || [];
        const activeRunners = runners.filter((r: any) => !r.scratched);

        const raceStatus = String(race.race_status || "").toLowerCase();

        const isFinished =
          raceStatus.includes("result") ||
          raceStatus.includes("finished") ||
          raceStatus.includes("closed");

        const isAbandoned =
          raceStatus.includes("abandon") || race.abandoned === true;

        if (isFinished || isAbandoned) continue;
        if (activeRunners.length < 8 || activeRunners.length > 11) continue;

        allRaces.push({
          source: "the-racing-api",
          raceId: race.id || race.race_id || `${meetId}-${race.race_number}`,
          meetId,
          date: today,
          course: race.course || meet.course || meet.name || null,
          state: race.state || meet.state || null,
          raceNumber: race.race_number,
          raceName: race.race_name,
          raceStatus: race.race_status,
          startTime: race.off_time || race.start_time || null,
          distance: race.distance || null,
          condition: race.going || race.condition || null,
          runnerCount: activeRunners.length,

          runners: runners.map((runner: any) => {
            const sportsbet = getOdds(runner, "Sportsbet");
            const ladbrokes = getOdds(runner, "Ladbrokes");

            return {
              number: runner.number,
              horse: runner.horse,
              jockey: runner.jockey || null,
              trainer: runner.trainer || null,
              barrier: runner.draw || runner.barrier || null,
              weight: runner.weight || null,
              scratched: runner.scratched === true,
              position: runner.position || null,

              odds: {
                sportsbetWin: sportsbet?.win_odds || null,
                sportsbetPlace: sportsbet?.place_odds || null,
                ladbrokesWin: ladbrokes?.win_odds || null,
                ladbrokesPlace: ladbrokes?.place_odds || null,
              },

              raw: runner,
            };
          }),

          raw: race,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      date: today,
      meetingCount: meetings.length,
      raceCount: allRaces.length,
      races: allRaces,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: String(error),
    });
  }
}
