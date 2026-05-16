import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  return raceStart > fiveMinutesAgo;
}

function countStarts(runner: any) {
  if (typeof runner.starts === "number") return runner.starts;
  if (!runner.form) return 0;
  return runner.form.replace(/[^0-9]/g, "").length;
}

function evaluateRecentForm(form: string, last20Starts?: string) {
  const formText = last20Starts || form;
  if (!formText) return 30;

  const results = formText
    .replace(/[^0-9]/g, "")
    .split("")
    .map(Number)
    .filter((n) => n > 0);

  if (results.length === 0) return 30;

  const recentResults = results.slice(0, 5);

  const score = recentResults.reduce((total, result, index) => {
    const recencyWeight = index === 0 ? 1.25 : index === 1 ? 1.1 : 1;

    if (result === 1) return total + 90 * recencyWeight;
    if (result === 2) return total + 75 * recencyWeight;
    if (result === 3) return total + 60 * recencyWeight;
    if (result <= 5) return total + 38 * recencyWeight;
    return total + 15 * recencyWeight;
  }, 0);

  return Math.round(score / recentResults.length);
}

function scoreRunner(runner: any) {
  const starts = countStarts(runner);
  const wins = Number(runner.wins || 0);
  const places = Number(runner.places || 0);

  const placePercent =
    typeof runner.placePercent === "number"
      ? runner.placePercent * 100
      : starts > 0
      ? (places / starts) * 100
      : 0;

  const winPercent =
    typeof runner.winPercent === "number"
      ? runner.winPercent * 100
      : starts > 0
      ? (wins / starts) * 100
      : 0;

  const recentForm = evaluateRecentForm(runner.form, runner.last20Starts);

  let score = 0;
  score += placePercent * 0.38;
  score += winPercent * 0.12;
  score += recentForm * 0.28;

  if (runner.jockey) score += 4;
  if (runner.trainer) score += 4;

  if (runner.draw) {
    score += Math.max(0, 10 - parseInt(String(runner.draw))) * 0.45;
  }

  const weight = Number(runner.lbs || 0);
  const claim = Number(runner.claim || 0);
  const adjustedWeight = weight && claim ? weight - claim : weight;

  if (adjustedWeight && adjustedWeight <= 54) score += 4;
  else if (adjustedWeight && adjustedWeight <= 56) score += 2;
  else if (adjustedWeight && adjustedWeight >= 60) score -= 3;

  score = Math.min(100, Math.max(0, score));

  let confidence = "LOW";
  if (score >= 65) confidence = "HIGH";
  else if (score >= 45) confidence = "MEDIUM";

  const reasoning: string[] = [];

  if (placePercent >= 55) reasoning.push("Strong overall place record");
  else if (placePercent >= 40) reasoning.push("Solid overall place record");

  if (recentForm >= 65) reasoning.push("Strong recent form");
  else if (recentForm >= 45) reasoning.push("Recent form support");

  if (starts >= 10) reasoning.push("Experienced runner");
  else if (starts >= 3) reasoning.push("Meets minimum race experience");

  if (runner.draw && Number(runner.draw) > 0 && Number(runner.draw) <= 6) {
    reasoning.push("Favourable barrier");
  }

  if (adjustedWeight && adjustedWeight <= 56) {
    reasoning.push("Manageable weight");
  }

  if (reasoning.length === 0) reasoning.push("Limited data available");

  return {
    ...runner,
    score: Math.round(score),
    confidence,
    displayPlacePercent: Math.round(placePercent),
    reasoning: reasoning.slice(0, 5),
  };
}

function getBestRunner(race: any) {
  if (!race.runners || race.runners.length === 0) return null;

  return (
    race.runners
      .filter((runner: any) => countStarts(runner) >= 3)
      .filter((runner: any) => !runner.scratched)
      .map((runner: any) => scoreRunner(runner))
      .sort((a: any, b: any) => b.score - a.score)[0] || null
  );
}

async function savePickToSupabase(race: any, bestRunner: any, pickDate: string) {
  if (!bestRunner) return;

  const { error } = await supabase.from("saved_picks").upsert(
    {
      race_date: pickDate,
      course: race.course || "",
      race_number: Number(race.race_number || 0),
      race_time: race.off_time || "",

      horse_number: Number(bestRunner.number || 0),
      horse_name: bestRunner.horse || "",

      confidence: bestRunner.confidence || "",
      ai_score: Number(bestRunner.score || 0),
      reasoning: Array.isArray(bestRunner.reasoning)
        ? bestRunner.reasoning.join(", ")
        : String(bestRunner.reasoning || ""),

      distance: race.distance || "",
      condition: race.condition || "",
      runner_count: Number(race.runner_count || 0),

      place_odds: null,
      result: "pending",
      placed: null,
      bet_size: null,
      profit_loss: null,
      running_bank: null,

      source: "formfav",
    },
    {
      onConflict: "race_date,course,race_number,horse_name",
    }
  );

  if (error) {
    console.error("Supabase saved_picks insert error:", error.message);
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
      .filter((race: any) => race.numberOfRunners >= 8 && race.numberOfRunners <= 11)
      .filter((race: any) => isRaceUpcoming(race.startTime))
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

        const hasFirstStarter = runners.some((runner: any) => runner.firstStarter);

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

    await Promise.all(
      cleanRacecards.map(async (race: any) => {
        const bestRunner = getBestRunner(race);

        if (
          bestRunner &&
          (bestRunner.confidence === "HIGH" || bestRunner.confidence === "MEDIUM")
        ) {
          await savePickToSupabase(race, bestRunner, today);
        }
      })
    );

    return NextResponse.json({
      ok: true,
      source: "FormFav",
      date: today,
      totalMeetings: meetings.length,
      candidateRaceCount: candidateRaces.length,
      savedToSupabase: true,
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
