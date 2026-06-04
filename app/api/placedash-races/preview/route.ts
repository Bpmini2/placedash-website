import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getMelbourneTomorrowDate() {
  const now = new Date();

  const melbourneNow = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Australia/Melbourne",
    })
  );

  melbourneNow.setDate(melbourneNow.getDate() + 1);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(melbourneNow);
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
    const previewDate = getMelbourneTomorrowDate();

    const meetingsRes = await fetch(
      `https://api.theracingapi.com/v1/australia/meets?date=${previewDate}`,
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

        const isAbandoned =
          raceStatus.includes("abandon") || race.abandoned === true;

        if (isAbandoned) continue;
        if (activeRunners.length < 8 || activeRunners.length > 11) continue;

        allRaces.push({
          source: "the-racing-api",
          previewOnly: true,
          raceId: race.id || race.race_id || `${meetId}-${race.race_number}`,
          meetId,
          date: previewDate,
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
              draw: runner.draw || runner.barrier || null,
              weight: runner.weight || null,
              form: runner.form || null,
              scratched: runner.scratched === true,
              position: runner.position || null,

              starts: Number(
                runner.stats?.career?.total ||
                  runner.career_stats?.total ||
                  runner.careerStats?.total ||
                  runner.last_ten_races_stats?.total ||
                  runner.lastTenRacesStats?.total ||
                  String(runner.form || "").replace(/[^0-9]/g, "").length ||
                  0
              ),

              wins: Number(
                runner.stats?.career?.first ||
                  runner.career_stats?.first ||
                  runner.careerStats?.first ||
                  runner.last_ten_races_stats?.first ||
                  0
              ),

              seconds: Number(
                runner.stats?.career?.second ||
                  runner.career_stats?.second ||
                  runner.careerStats?.second ||
                  runner.last_ten_races_stats?.second ||
                  0
              ),

              thirds: Number(
                runner.stats?.career?.third ||
                  runner.career_stats?.third ||
                  runner.careerStats?.third ||
                  runner.last_ten_races_stats?.third ||
                  0
              ),

              places:
                Number(
                  runner.stats?.career?.places ||
                    runner.career_stats?.places ||
                    runner.career_place_total ||
                    0
                ) ||
                Number(
                  runner.stats?.career?.first ||
                    runner.career_stats?.first ||
                    runner.last_ten_races_stats?.first ||
                    0
                ) +
                  Number(
                    runner.stats?.career?.second ||
                      runner.career_stats?.second ||
                      runner.last_ten_races_stats?.second ||
                      0
                  ) +
                  Number(
                    runner.stats?.career?.third ||
                      runner.career_stats?.third ||
                      runner.last_ten_races_stats?.third ||
                      0
                  ),

              placePercent: Number(
                runner.stats?.career?.placePercent ||
                  runner.career_stats?.placePercent ||
                  runner.career_place_percent ||
                  runner.placePercent ||
                  0
              ),

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
      previewOnly: true,
      date: previewDate,
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
