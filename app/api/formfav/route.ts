import { NextResponse } from "next/server";

function getMelbourneDate() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Australia/Melbourne",
  });
}

function formatRaceTime(startTime: string | null, timezone: string | null) {
  if (!startTime) return "TBA";

  try {
    return new Date(startTime).toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone || "Australia/Melbourne",
    });
  } catch {
    return "TBA";
  }
}

export async function GET() {
  try {
    const apiKey = process.env.FORMFAV_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        ok: false,
        error: "FORMFAV_API_KEY is missing",
      });
    }

    const today = getMelbourneDate();

    const meetingsRes = await fetch(
      `https://api.formfav.com/v1/form/meetings?date=${today}`,
      {
        headers: {
          "X-API-Key": apiKey,
        },
        cache: "no-store",
      }
    );

    const meetingsData = await meetingsRes.json();
    const meetings = meetingsData?.meetings || meetingsData?.data?.meetings || [];

    const candidateRaces = meetings
      .filter((meeting: any) => meeting.country === "au")
      .flatMap((meeting: any) =>
        (meeting.races || []).map((race: any) => ({
          track: meeting.track,
          slug: meeting.slug,
          country: meeting.country,
          raceNumber: race.raceNumber,
          raceName: race.raceName,
          startTime: race.startTime,
          timezone: race.timezone,
          numberOfRunners: race.numberOfRunners,
        }))
      )
      .filter((race: any) => {
        return race.numberOfRunners >= 8 && race.numberOfRunners <= 11;
      })
      .slice(0, 6);

    const racecards = await Promise.all(
      candidateRaces.map(async (race: any) => {
        const raceRes = await fetch(
          `https://api.formfav.com/v1/form?date=${today}&track=${encodeURIComponent(
            race.slug
          )}&race=${race.raceNumber}`,
          {
            headers: {
              "X-API-Key": apiKey,
            },
            cache: "no-store",
          }
        );

        const raceData = await raceRes.json();
        const card = raceData?.data || raceData;

        const runners = (card?.runners || []).map((runner: any) => ({
          horse: runner.name || "Unknown",
          jockey: runner.jockey || "",
          trainer: runner.trainer || "",
          draw: runner.barrier || "",
          lbs: runner.weight || "",
          form: runner.form || "",
          starts: runner?.stats?.overall?.starts || 0,
          wins: runner?.stats?.overall?.wins || 0,
          places: runner?.stats?.overall?.places || 0,
          placePercent: runner?.stats?.overall?.placePercent || 0,
          winPercent: runner?.stats?.overall?.winPercent || 0,
          firstStarter: (runner?.stats?.overall?.starts || 0) === 0,
        }));

        const hasFirstStarter = runners.some((runner: any) => runner.firstStarter);

        return {
          course: card?.track || race.track,
          race_number: card?.raceNumber || race.raceNumber,
          race_name: card?.raceName || race.raceName,
          off_time: formatRaceTime(card?.startTime || race.startTime, card?.timezone || race.timezone),
          start_time: card?.startTime || race.startTime,
          runners,
          runner_count: runners.length,
          has_first_starter: hasFirstStarter,
          condition: card?.condition || "",
          weather: card?.weather || "",
          distance: card?.distance || "",
        };
      })
    );

    const cleanRacecards = racecards.filter((race: any) => {
      return (
        race.runners.length >= 8 &&
        race.runners.length <= 11 &&
        race.has_first_starter === false
      );
    });

    return NextResponse.json({
      ok: true,
      source: "FormFav",
      date: today,
      totalMeetings: meetings.length,
      candidateRaceCount: candidateRaces.length,
      racecards: cleanRacecards,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: "Failed to fetch FormFav racecards",
      details: String(error),
    });
  }
}
