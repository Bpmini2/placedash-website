import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.FORMFAV_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        error: "FORMFAV_API_KEY is missing",
      });
    }

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Australia/Melbourne",
    });

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

    const meetings = meetingsData?.data?.meetings || [];

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
      numberOfRunners: race.numberOfRunners,
      timezone: race.timezone,
    }))
  );

return NextResponse.json({
  status: 200,
  ok: true,
  date: today,
  totalMeetings: meetings.length,
  candidateRaceCount: candidateRaces.length,
  candidateRaces,
});
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
        const card = raceData?.data;

        return {
          course: card?.track || race.track,
          race_number: card?.raceNumber || race.raceNumber,
          race_name: card?.raceName || race.raceName,
          off_time: card?.startTime
            ? new Date(card.startTime).toLocaleTimeString("en-AU", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: card.timezone || "Australia/Melbourne",
              })
            : "TBA",
          runners: (card?.runners || []).map((runner: any) => ({
            horse: runner.name,
            jockey: runner.jockey,
            trainer: runner.trainer,
            draw: runner.barrier,
            lbs: runner.weight,
            form: runner.form,
            starts: runner?.stats?.overall?.starts || 0,
            wins: runner?.stats?.overall?.wins || 0,
            places: runner?.stats?.overall?.places || 0,
            placePercent: runner?.stats?.overall?.placePercent || 0,
            winPercent: runner?.stats?.overall?.winPercent || 0,
          })),
        };
      })
    );

    return NextResponse.json({
      status: 200,
      ok: true,
      date: today,
      racecards: raceCards,
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to fetch FormFav racecards",
      details: String(error),
    });
  }
}
