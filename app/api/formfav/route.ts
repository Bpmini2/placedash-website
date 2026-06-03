import { NextResponse } from "next/server";

function getMelbourneDate() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Australia/Melbourne",
  });
}

function getMelbourneTomorrowDate() {
  const now = new Date();

  const melbourneDate = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Australia/Melbourne",
    })
  );

  melbourneDate.setDate(melbourneDate.getDate() + 1);

  return melbourneDate.toLocaleDateString("en-CA");
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

function isAustralianMeeting(meeting: any) {
  const country = String(meeting?.country || "").toLowerCase();

  return country === "au" || country === "aus" || country === "australia";
}

function getRaceStartMs(startTime: string | null) {
  if (!startTime) return null;

  const parsed = new Date(startTime).getTime();

  if (Number.isNaN(parsed)) return null;

  return parsed;
}

function isRaceUpcoming(startTime: string | null) {
  const raceStart = getRaceStartMs(startTime);

  if (!raceStart) return false;

  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  return raceStart > fiveMinutesAgo;
}

function getRaceTimeDebug(startTime: string | null) {
  const raceStart = getRaceStartMs(startTime);

  if (!raceStart) {
    return {
      hasStartTime: Boolean(startTime),
      parseable: false,
      alreadyStarted: null,
      minutesUntilStart: null,
    };
  }

  const now = Date.now();

  return {
    hasStartTime: true,
    parseable: true,
    alreadyStarted: raceStart <= now - 5 * 60 * 1000,
    minutesUntilStart: Math.round((raceStart - now) / 60000),
  };
}

function mapRaceSummary(meeting: any, race: any) {
  return {
    track: meeting.track,
    slug: meeting.slug,
    country: meeting.country,
    raceNumber: race.raceNumber,
    raceName: race.raceName,
    startTime: race.startTime,
    timezone: race.timezone,
    numberOfRunners: Number(race.numberOfRunners || 0),
  };
}

function buildSkipSample(races: any[], reason: string) {
  return races.slice(0, 10).map((race: any) => ({
    reason,
    track: race.track,
    raceNumber: race.raceNumber,
    raceName: race.raceName,
    startTime: race.startTime,
    numberOfRunners: race.numberOfRunners,
    timeDebug: getRaceTimeDebug(race.startTime),
  }));
}

export async function GET(request: Request) {
  try {
    const apiKey = process.env.FORMFAV_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        ok: false,
        error: "FORMFAV_API_KEY is missing",
      });
    }

    const url = new URL(request.url);
    const previewMode = url.searchParams.get("preview") === "tomorrow";
    const debugMode = url.searchParams.get("debug") === "1";
    const targetDate = previewMode
      ? getMelbourneTomorrowDate()
      : getMelbourneDate();

    const meetingsRes = await fetch(
      `https://api.formfav.com/v1/form/meetings?date=${targetDate}`,
      {
        headers: {
          "X-API-Key": apiKey,
        },
        cache: "no-store",
      }
    );

    const meetingsData = await meetingsRes.json();

    if (!meetingsRes.ok) {
      return NextResponse.json({
        ok: false,
        source: "FormFav",
        date: targetDate,
        error: "Failed to fetch FormFav meetings",
        status: meetingsRes.status,
        details: meetingsData,
      });
    }

    const meetings =
      meetingsData?.meetings || meetingsData?.data?.meetings || [];

    const auMeetings = meetings.filter((meeting: any) =>
      isAustralianMeeting(meeting)
    );

    const allAuRaces = auMeetings.flatMap((meeting: any) =>
      (meeting.races || []).map((race: any) => mapRaceSummary(meeting, race))
    );

    const rejectedByRunnerCount = allAuRaces.filter(
      (race: any) => race.numberOfRunners < 8 || race.numberOfRunners > 11
    );

    const runnerCountCandidates = allAuRaces.filter(
      (race: any) => race.numberOfRunners >= 8 && race.numberOfRunners <= 11
    );

    const rejectedByStartTime = runnerCountCandidates.filter(
      (race: any) => !isRaceUpcoming(race.startTime)
    );

    const upcomingCandidateRaces = runnerCountCandidates.filter((race: any) =>
      isRaceUpcoming(race.startTime)
    );

    // Only fetch detailed race cards for possible candidates. This keeps API usage sensible.
    const candidateRaces = upcomingCandidateRaces.slice(0, 12);

    const racecards = await Promise.all(
      candidateRaces.map(async (race: any) => {
        try {
          const raceRes = await fetch(
            `https://api.formfav.com/v1/form?date=${targetDate}&track=${encodeURIComponent(
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

          if (!raceRes.ok) {
            return {
              fetch_error: true,
              fetch_status: raceRes.status,
              course: race.track,
              race_number: race.raceNumber,
              race_name: race.raceName,
              start_time: race.startTime,
              runners: [],
              runner_count: 0,
              has_first_starter: false,
            };
          }

          const card = raceData?.data || raceData;

          const timezone = card?.timezone || race.timezone || null;
          const startTime = card?.startTime || race.startTime || null;

          const runners = (card?.runners || [])
            .map((runner: any) => ({
              number: runner.number || "",
              horse: runner.name || "Unknown",
              jockey: runner.jockey || "",
              trainer: runner.trainer || "",
              draw: runner.barrier || "",
              lbs: runner.weight || "",
              claim: runner.claim || "",
              age: runner.age || "",
              sex: runner.sex || "",
              form: runner.form || "",
              last20Starts: runner.last20Starts || "",
              careerPrizeMoney: runner.careerPrizeMoney || "",
              scratched: runner.scratched || false,

              starts: runner?.stats?.overall?.starts || 0,
              wins: runner?.stats?.overall?.wins || 0,
              places: runner?.stats?.overall?.places || 0,
              seconds: runner?.stats?.overall?.seconds || 0,
              thirds: runner?.stats?.overall?.thirds || 0,
              placePercent: runner?.stats?.overall?.placePercent || 0,
              winPercent: runner?.stats?.overall?.winPercent || 0,

              trackStats: runner?.stats?.track || null,
              distanceStats: runner?.stats?.distance || null,
              trackDistanceStats: runner?.stats?.trackDistance || null,
              conditionStats: runner?.stats?.condition || null,

              speedMap: runner.speedMap || null,
              classProfile: runner.classProfile || null,
              raceClassFit: runner.raceClassFit || null,
              gearChange: runner.gearChange || null,

              firstStarter: (runner?.stats?.overall?.starts || 0) === 0,
            }))
            .filter((runner: any) => runner.scratched === false);

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
        } catch (error) {
          return {
            fetch_error: true,
            course: race.track,
            race_number: race.raceNumber,
            race_name: race.raceName,
            start_time: race.startTime,
            runners: [],
            runner_count: 0,
            has_first_starter: false,
            error: String(error),
          };
        }
      })
    );

    const rejectedAfterRacecard = racecards.filter((race: any) => {
      return !(
        race.runners.length >= 8 &&
        race.runners.length <= 11 &&
        race.has_first_starter === false &&
        isRaceUpcoming(race.start_time)
      );
    });

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

    const debug = debugMode
      ? {
          totalMeetings: meetings.length,
          australianMeetings: auMeetings.length,
          totalAustralianRaces: allAuRaces.length,
          rejectedByRunnerCount: rejectedByRunnerCount.length,
          runnerCountCandidates: runnerCountCandidates.length,
          rejectedByStartTime: rejectedByStartTime.length,
          upcomingCandidateRaces: upcomingCandidateRaces.length,
          detailedRacecardsFetched: racecards.length,
          rejectedAfterRacecard: rejectedAfterRacecard.length,
          finalCleanRacecards: cleanRacecards.length,
          samples: {
            rejectedByRunnerCount: buildSkipSample(
              rejectedByRunnerCount,
              "Runner count outside 8-11"
            ),
            rejectedByStartTime: buildSkipSample(
              rejectedByStartTime,
              "Race start time missing, invalid, or already started"
            ),
            upcomingCandidates: upcomingCandidateRaces
              .slice(0, 10)
              .map((race: any) => ({
                track: race.track,
                raceNumber: race.raceNumber,
                raceName: race.raceName,
                startTime: race.startTime,
                numberOfRunners: race.numberOfRunners,
                timeDebug: getRaceTimeDebug(race.startTime),
              })),
            rejectedAfterRacecard: rejectedAfterRacecard
              .slice(0, 10)
              .map((race: any) => ({
                course: race.course,
                raceNumber: race.race_number,
                raceName: race.race_name,
                startTime: race.start_time,
                runnerCount: race.runners?.length || 0,
                hasFirstStarter: race.has_first_starter,
                timeDebug: getRaceTimeDebug(race.start_time),
                fetchError: race.fetch_error || false,
              })),
          },
        }
      : undefined;

    return NextResponse.json({
      ok: true,
      source: "FormFav",
      date: targetDate,
      totalMeetings: meetings.length,
      australianMeetings: auMeetings.length,
      candidateRaceCount: upcomingCandidateRaces.length,
      previewMode,
      savedToSupabase: false,
      racecards: cleanRacecards,
      message:
        cleanRacecards.length === 0
          ? "No qualifying upcoming races found for this date. PlaceDash currently filters Australian races, 8-11 active runners, no first starters, and races not already started."
          : "Upcoming qualifying races loaded successfully.",
      ...(debugMode ? { debug } : {}),
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: "Failed to fetch FormFav racecards",
      details: String(error),
    });
  }
}
