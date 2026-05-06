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
  } catch (error) {
    return NextResponse.json({
      error: "Failed to fetch FormFav meetings",
      details: String(error),
    });
  }
}
