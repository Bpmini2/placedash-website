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

function getStateFromTimezone(timezone: string | null) {
  if (!timezone) return "";

  if (timezone.includes("Perth")) return "WA";
  if (timezone.includes("Sydney")) return "NSW";
  if (timezone.includes("Melbourne")) return "VIC";
  if (timezone.includes("Brisbane")) return "QLD";
  if (timezone.includes("Adelaide")) return "SA";
  if (timezone.includes("Hobart")) return "TAS";
  if (timezone.includes("Darwin")) return "NT";

  return "";
}

function getTimezoneLabel(timezone: string | null) {
  if (!timezone) return "";

  if (timezone.includes("Perth")) return "AWST";
  if (timezone.includes("Adelaide")) return "ACST";
  if (timezone.includes("Darwin")) return "ACST";
  if (timezone.includes("Brisbane")) return "AEST";
  if (timezone.includes("Sydney")) return "AEST/AEDT";
  if (timezone.includes("Melbourne")) return "AEST/AEDT";
  if (timezone.includes("Hobart")) return "AEST/AEDT";

  return "";
}

function isRaceUpcoming(startTime: string | null) {
  if (!startTime) return false;

  const raceStart = new Date(startTime).getTime();
  const now = Date.now();

  // Small buffer so a race does not disappear exactly on the minute it starts.
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  return raceStart > fiveMinutesAgo;
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
      .filter((race: any) => {
        return isRaceUpcoming(race.startTime);
      })
      .slice(0, 8);

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

        const timezone = card?.timezone || race.timezone || null;
        const startTime = card?.startTime || race.startTime || null;

        const runners = (card?.runners || []).map((runner: any) => ({
          number: runner.number || "",
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

        const hasFirstStarter = runners.some(
          (runner: any) => runner.firstStarter
        );

        return {
          course: card?.track || race.track,
          race_number: card?.raceNumber || race.raceNumber,
          race_name: card?.raceName || race.raceName,
          off_time: formatRaceTime(startTime, timezone),
          start_time: startTime,
          state: getStateFromTimezone(timezone),
          timezone_label: getTimezoneLabel(timezone),
          runners,
          runner_count: runners.length,
          has_first_starter: hasFirstStarter,
          condition: card?.condition || "",
          weather: card?.weather || "",
          distance: card?.distance || "",
        };
      })
    );

    const cleanRacecards = racecards
      .filter((race: any) => {
        return (
          race.runners.length >= 8 &&
          race.runners.length <= 11 &&
          race.has_first_starter === false &&
          isRaceUpcoming(race.start_time)
        );
      })
      .slice(0, 6);

    return NextResponse.json({
      ok: true,
      source: "FormFav",
      date: today,
      totalMeetings: meetings.length,
      candidateRaceCount: candidateRaces.length,
      racecards: cleanRacecards,
      message:
        cleanRacecards.length === 0
          ? "No qualifying upcoming races found today. PlaceDash only shows Australian races with 8–11 runners, no first starters, and races that have not already started."
          : "Upcoming qualifying races loaded successfully.",
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: "Failed to fetch FormFav racecards",
      details: String(error),
    });
  }
}
