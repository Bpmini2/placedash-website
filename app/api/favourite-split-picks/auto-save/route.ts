import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type AutoSaveMode = "today" | "preview";

type SkipReason =
  | "duplicate"
  | "field_size"
  | "missing_odds"
  | "odds_too_short_or_not_value"
  | "scratched"
  | "finished_or_abandoned"
  | "missing_race_details"
  | "error";

function toNumber(value: any, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getMelbourneDateOffset(daysToAdd: number) {
  const now = new Date();

  const melbourneParts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(
    melbourneParts.find((part) => part.type === "year")?.value
  );
  const month = Number(
    melbourneParts.find((part) => part.type === "month")?.value
  );
  const day = Number(
    melbourneParts.find((part) => part.type === "day")?.value
  );

  const targetDate = new Date(Date.UTC(year, month - 1, day + daysToAdd));

  const yyyy = targetDate.getUTCFullYear();
  const mm = String(targetDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(targetDate.getUTCDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function getRaceDate(mode: AutoSaveMode) {
  return mode === "preview"
    ? getMelbourneDateOffset(1)
    : getMelbourneDateOffset(0);
}

function getOdds(runner: any, bookmaker: string) {
  const bookmakerLower = bookmaker.toLowerCase();

  if (Array.isArray(runner.odds)) {
    return (
      runner.odds.find(
        (odd: any) =>
          String(odd.bookmaker || "").toLowerCase() === bookmakerLower
      ) || null
    );
  }

  return null;
}

function normaliseRunner(runner: any) {
  const sportsbet = getOdds(runner, "Sportsbet");
  const ladbrokes = getOdds(runner, "Ladbrokes");

  return {
    number:
      runner.number ||
      runner.runner_number ||
      runner.runnerNumber ||
      runner.saddlecloth ||
      runner.cloth_number ||
      runner.clothNumber ||
      "",
    horse:
      runner.horse ||
      runner.name ||
      runner.horse_name ||
      runner.horseName ||
      "",
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

    sportsbet_win:
      sportsbet?.win_odds ||
      runner.sportsbet_win ||
      runner.sportsbetWin ||
      runner.odds?.sportsbetWin ||
      null,
    sportsbet_place:
      sportsbet?.place_odds ||
      runner.sportsbet_place ||
      runner.sportsbetPlace ||
      runner.odds?.sportsbetPlace ||
      null,
    ladbrokes_win:
      ladbrokes?.win_odds ||
      runner.ladbrokes_win ||
      runner.ladbrokesWin ||
      runner.odds?.ladbrokesWin ||
      null,
    ladbrokes_place:
      ladbrokes?.place_odds ||
      runner.ladbrokes_place ||
      runner.ladbrokesPlace ||
      runner.odds?.ladbrokesPlace ||
      null,

    odds: {
      sportsbetWin:
        sportsbet?.win_odds ||
        runner.sportsbet_win ||
        runner.sportsbetWin ||
        runner.odds?.sportsbetWin ||
        null,
      sportsbetPlace:
        sportsbet?.place_odds ||
        runner.sportsbet_place ||
        runner.sportsbetPlace ||
        runner.odds?.sportsbetPlace ||
        null,
      ladbrokesWin:
        ladbrokes?.win_odds ||
        runner.ladbrokes_win ||
        runner.ladbrokesWin ||
        runner.odds?.ladbrokesWin ||
        null,
      ladbrokesPlace:
        ladbrokes?.place_odds ||
        runner.ladbrokes_place ||
        runner.ladbrokesPlace ||
        runner.odds?.ladbrokesPlace ||
        null,
    },

    raw: runner,
  };
}

function getRunnerWinOddsOptions(runner: any) {
  return [
    {
      bookmaker: "Sportsbet",
      winOdds: Number(
        runner?.sportsbet_win ||
          runner?.sportsbetWin ||
          runner?.sportsbet_win_odds ||
          runner?.odds?.sportsbetWin ||
          0
      ),
      placeOdds: Number(
        runner?.sportsbet_place ||
          runner?.sportsbetPlace ||
          runner?.sportsbet_place_odds ||
          runner?.odds?.sportsbetPlace ||
          0
      ),
    },
    {
      bookmaker: "Ladbrokes",
      winOdds: Number(
        runner?.ladbrokes_win ||
          runner?.ladbrokesWin ||
          runner?.ladbrokes_win_odds ||
          runner?.odds?.ladbrokesWin ||
          0
      ),
      placeOdds: Number(
        runner?.ladbrokes_place ||
          runner?.ladbrokesPlace ||
          runner?.ladbrokes_place_odds ||
          runner?.odds?.ladbrokesPlace ||
          0
      ),
    },
  ].filter(
    (option) =>
      Number.isFinite(option.winOdds) &&
      option.winOdds > 1 &&
      Number.isFinite(option.placeOdds) &&
      option.placeOdds > 1
  );
}

function getFavouriteSplitCandidate(race: any) {
  const candidates = (race.runners || [])
    .filter((runner: any) => !runner.scratched)
    .flatMap((runner: any) =>
      getRunnerWinOddsOptions(runner).map((oddsOption) => ({
        runner,
        bookmaker: oddsOption.bookmaker,
        winOdds: oddsOption.winOdds,
        placeOdds: oddsOption.placeOdds,
      }))
    )
    .sort((a: any, b: any) => a.winOdds - b.winOdds);

  if (!candidates.length) {
    return {
      canSave: false,
      skipReason: "missing_odds" as SkipReason,
      message:
        "Favourite Split skipped — no favourite could be found because win/place odds are missing.",
    };
  }

  const favourite = candidates[0];

  const horse =
    favourite.runner.horse ||
    favourite.runner.name ||
    favourite.runner.horse_name ||
    favourite.runner.horseName;

  const number =
    favourite.runner.number ||
    favourite.runner.runner_number ||
    favourite.runner.runnerNumber ||
    favourite.runner.saddlecloth ||
    favourite.runner.cloth_number ||
    favourite.runner.clothNumber ||
    "";

  if (!favourite.winOdds || !favourite.placeOdds) {
    return {
      canSave: false,
      skipReason: "missing_odds" as SkipReason,
      message:
        "Favourite Split skipped — no favourite could be found because win/place odds are missing.",
      runner: favourite.runner,
      horse,
      number,
    };
  }

  if (favourite.placeOdds < 1.35) {
    return {
      canSave: false,
      skipReason: "odds_too_short_or_not_value" as SkipReason,
      message: "Favourite Split skipped — odds too short / not enough value.",
      runner: favourite.runner,
      bookmaker: favourite.bookmaker,
      winOdds: favourite.winOdds,
      placeOdds: favourite.placeOdds,
      horse,
      number,
    };
  }

  if (favourite.winOdds < 2.2 || favourite.winOdds > 4.5) {
    return {
      canSave: false,
      skipReason: "odds_too_short_or_not_value" as SkipReason,
      message: "Favourite Split skipped — odds too short / not enough value.",
      runner: favourite.runner,
      bookmaker: favourite.bookmaker,
      winOdds: favourite.winOdds,
      placeOdds: favourite.placeOdds,
      horse,
      number,
    };
  }

  return {
    canSave: true,
    runner: favourite.runner,
    bookmaker: favourite.bookmaker,
    winOdds: favourite.winOdds,
    placeOdds: favourite.placeOdds,
    horse,
    number,
  };
}

async function getCurrentBank() {
  const { data, error } = await supabase
    .from("favourite_split_picks")
    .select("bank_before_bet, profit_loss, strategy_version")
    .eq("strategy_version", "v3_favourite_split")
    .order("race_date", { ascending: true })
    .order("race_number", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const picks = data || [];

  if (!picks.length) return 1000;

  const startingBank = toNumber(picks[0].bank_before_bet, 1000);
  const totalProfitLoss = picks.reduce(
    (sum, pick) => sum + toNumber(pick.profit_loss),
    0
  );

  return roundMoney(startingBank + totalProfitLoss);
}

async function alreadySaved(raceDate: string, course: string, raceNumber: any) {
  const { data, error } = await supabase
    .from("favourite_split_picks")
    .select("id")
    .eq("race_date", raceDate)
    .eq("course", course)
    .eq("race_number", raceNumber)
    .eq("strategy_version", "v3_favourite_split")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

function createReport() {
  return {
    racesScanned: 0,
    racesAfterFieldFilter: 0,
    saved: 0,
    skippedDuplicate: 0,
    skippedFieldSize: 0,
    skippedMissingOdds: 0,
    skippedOddsTooShortOrNotValue: 0,
    skippedScratched: 0,
    skippedFinishedOrAbandoned: 0,
    skippedMissingRaceDetails: 0,
    errors: 0,
  };
}

function addSkip(report: any, reason: SkipReason) {
  if (reason === "duplicate") report.skippedDuplicate += 1;
  else if (reason === "field_size") report.skippedFieldSize += 1;
  else if (reason === "missing_odds") report.skippedMissingOdds += 1;
  else if (reason === "odds_too_short_or_not_value") {
    report.skippedOddsTooShortOrNotValue += 1;
  } else if (reason === "scratched") report.skippedScratched += 1;
  else if (reason === "finished_or_abandoned") {
    report.skippedFinishedOrAbandoned += 1;
  } else if (reason === "missing_race_details") {
    report.skippedMissingRaceDetails += 1;
  } else {
    report.errors += 1;
  }
}

async function runAutoSave(mode: AutoSaveMode) {
  const username = process.env.RACING_API_USERNAME;
  const password = process.env.RACING_API_PASSWORD;

  if (!username || !password) {
    throw new Error("Missing RACING_API_USERNAME or RACING_API_PASSWORD");
  }

  const auth = Buffer.from(`${username}:${password}`).toString("base64");
  const raceDate = getRaceDate(mode);
  const report = createReport();
  const details: any[] = [];

  const currentBank = await getCurrentBank();
  const totalStake = roundMoney(currentBank * 0.1);
  const winStake = roundMoney(totalStake * 0.25);
  const placeStake = roundMoney(totalStake * 0.75);

  const meetingsRes = await fetch(
    `https://api.theracingapi.com/v1/australia/meets?date=${raceDate}`,
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
      report.racesScanned += 1;

      const runners = race.runners || [];
      const normalisedRunners = runners.map((runner: any) =>
        normaliseRunner(runner)
      );
      const activeRunners = normalisedRunners.filter(
        (runner: any) => !runner.scratched
      );

      const raceStatus = String(race.race_status || "").toLowerCase();

      const isFinished =
        raceStatus.includes("result") ||
        raceStatus.includes("finished") ||
        raceStatus.includes("closed");

      const isAbandoned =
        raceStatus.includes("abandon") || race.abandoned === true;

      if ((mode === "today" && (isFinished || isAbandoned)) || isAbandoned) {
        addSkip(report, "finished_or_abandoned");
        details.push({
          course: race.course || meet.course || meet.name || null,
          raceNumber: race.race_number,
          action: "skipped",
          reason: "finished_or_abandoned",
        });
        continue;
      }

      if (activeRunners.length < 8 || activeRunners.length > 11) {
        addSkip(report, "field_size");
        details.push({
          course: race.course || meet.course || meet.name || null,
          raceNumber: race.race_number,
          action: "skipped",
          reason: "field_size",
          activeRunners: activeRunners.length,
        });
        continue;
      }

      report.racesAfterFieldFilter += 1;

      const course = race.course || meet.course || meet.name || null;
      const raceNumber = race.race_number;

      if (!course || !raceNumber) {
        addSkip(report, "missing_race_details");
        details.push({
          course,
          raceNumber,
          action: "skipped",
          reason: "missing_race_details",
        });
        continue;
      }

      try {
        const duplicate = await alreadySaved(raceDate, course, raceNumber);

        if (duplicate) {
          addSkip(report, "duplicate");
          details.push({
            course,
            raceNumber,
            action: "skipped",
            reason: "duplicate",
          });
          continue;
        }

        const raceForSelection = {
          ...race,
          course,
          race_number: raceNumber,
          runners: normalisedRunners,
        };

        const favourite = getFavouriteSplitCandidate(raceForSelection);

        if (!favourite.canSave) {
          addSkip(report, favourite.skipReason || "error");
          details.push({
            course,
            raceNumber,
            action: "skipped",
            reason: favourite.skipReason || "error",
            message: favourite.message,
            horse: favourite.horse || null,
            horseNumber: favourite.number || null,
            winOdds: favourite.winOdds || null,
            placeOdds: favourite.placeOdds || null,
          });
          continue;
        }

        const insertPayload = {
          race_date: raceDate,
          course,
          race_number: raceNumber,
          race_time: race.off_time || race.start_time || null,
          state: race.state || meet.state || null,

          favourite_horse: favourite.horse,
          horse_number: favourite.number || null,

          win_odds: favourite.winOdds,
          place_odds: favourite.placeOdds,

          bank_before_bet: currentBank,
          total_stake: totalStake,
          win_stake: winStake,
          place_stake: placeStake,

          finish_position: null,
          status: "pending",

          win_return: 0,
          place_return: 0,
          total_return: 0,
          profit_loss: 0,
          bank_after_bet: currentBank,

          strategy_version: "v3_favourite_split",
          source:
            mode === "preview"
              ? "admin_auto_save_preview"
              : "admin_auto_save_today",

          race_card_json: normalisedRunners,
        };

        const { data, error } = await supabase
          .from("favourite_split_picks")
          .insert(insertPayload)
          .select()
          .single();

        if (error) {
          addSkip(report, "error");
          details.push({
            course,
            raceNumber,
            action: "error",
            reason: "error",
            error: error.message,
          });
          continue;
        }

        report.saved += 1;
        details.push({
          course,
          raceNumber,
          action: "saved",
          id: data?.id,
          horse: favourite.horse,
          horseNumber: favourite.number,
          bookmaker: favourite.bookmaker,
          winOdds: favourite.winOdds,
          placeOdds: favourite.placeOdds,
          totalStake,
          winStake,
          placeStake,
        });
      } catch (error: any) {
        addSkip(report, "error");
        details.push({
          course,
          raceNumber,
          action: "error",
          reason: "error",
          error: error.message || String(error),
        });
      }
    }
  }

  return {
    mode,
    date: raceDate,
    meetingCount: meetings.length,
    currentBank,
    stakePlan: {
      totalStake,
      winStake,
      placeStake,
    },
    report,
    details,
  };
}

async function resolveModeFromRequest(request: Request): Promise<AutoSaveMode> {
  const url = new URL(request.url);
  const queryMode = String(url.searchParams.get("mode") || "").toLowerCase();

  if (queryMode === "preview" || queryMode === "tomorrow") return "preview";
  if (queryMode === "today") return "today";

  try {
    const body = await request.json();
    const bodyMode = String(body?.mode || "").toLowerCase();

    if (bodyMode === "preview" || bodyMode === "tomorrow") return "preview";
    if (bodyMode === "today") return "today";
  } catch {
    // No JSON body is fine. Default to today.
  }

  return "today";
}

export async function POST(request: Request) {
  try {
    const mode = await resolveModeFromRequest(request);
    const result = await runAutoSave(mode);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message || String(error),
    });
  }
}

export async function GET(request: Request) {
  try {
    const mode = await resolveModeFromRequest(request);
    const result = await runAutoSave(mode);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message || String(error),
    });
  }
}
