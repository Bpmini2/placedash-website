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

function normaliseText(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function getRunnerPosition(runner: any) {
  const rawPosition =
    runner.position ??
    runner.finishingPosition ??
    runner.finishing_position ??
    runner.result ??
    runner.finishPosition ??
    runner.finish_position ??
    runner.place ??
    runner.placing;

  const parsed = Number(String(rawPosition || "").replace(/[^0-9]/g, ""));

  return parsed > 0 ? parsed : null;
}

function isScratchedRunner(runner: any) {
  const statusText = String(
    runner.status ||
      runner.runnerStatus ||
      runner.runner_status ||
      runner.scratched ||
      runner.isScratched ||
      runner.is_scratched ||
      runner.result ||
      runner.resultStatus ||
      runner.result_status ||
      ""
  ).toLowerCase();

  return (
    runner.scratched === true ||
    runner.isScratched === true ||
    runner.is_scratched === true ||
    statusText.includes("scr") ||
    statusText.includes("scratch") ||
    statusText.includes("withdrawn")
  );
}

function getRunnerDividend(runner: any) {
  const directDividend =
    runner.place_dividend ??
    runner.placeDividend ??
    runner.place_odds ??
    runner.placeOdds ??
    runner.dividend ??
    null;

  if (directDividend) {
    const parsed = Number(String(directDividend).replace(/[^0-9.]/g, ""));
    return parsed > 0 ? parsed : null;
  }

  const odds = Array.isArray(runner.odds) ? runner.odds : [];

  const sportsbet = odds.find(
    (odd: any) => String(odd.bookmaker || "").toLowerCase() === "sportsbet"
  );

  const ladbrokes = odds.find(
    (odd: any) => String(odd.bookmaker || "").toLowerCase() === "ladbrokes"
  );

  const sportsbetPlace = sportsbet?.place_odds ?? sportsbet?.placeOdds;
  const ladbrokesPlace = ladbrokes?.place_odds ?? ladbrokes?.placeOdds;

  const preferredPlace = sportsbetPlace || ladbrokesPlace;

  if (!preferredPlace) return null;

  const parsed = Number(String(preferredPlace).replace(/[^0-9.]/g, ""));

  return parsed > 0 ? parsed : null;
}

async function getPuntingFormMeetings(date: string) {
  const apiKey = process.env.PUNTINGFORM_API_KEY;

  if (!apiKey) return [];

  const res = await fetch(
    `https://api.puntingform.com.au/v2/form/meetingslist?meetingDate=${date}&apiKey=${apiKey}`,
    {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (!res.ok || data?.statusCode >= 400) return [];

  return data?.payLoad || [];
}

async function findPuntingFormMeetingId(date: string, course: string) {
  const meetings = await getPuntingFormMeetings(date);

  const matched = meetings.find((meeting: any) => {
    const meetingName = meeting?.track?.name || meeting?.name || meeting?.track;
    return normaliseText(meetingName) === normaliseText(course);
  });

  return matched?.meetingId || null;
}

async function fetchPuntingFormRaceResult(
  date: string,
  course: string,
  raceNumber: number
) {
  const apiKey = process.env.PUNTINGFORM_API_KEY;

  if (!apiKey) return null;

  const meetingId = await findPuntingFormMeetingId(date, course);

  if (!meetingId) return null;

  const res = await fetch(
    `https://api.puntingform.com.au/v2/form/results?meetingId=${meetingId}&raceNumber=${raceNumber}&apiKey=${apiKey}`,
    {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (!res.ok || data?.statusCode >= 400) return null;

  const meetingResult = Array.isArray(data?.payLoad)
    ? data.payLoad[0]
    : data?.payLoad;

  const raceResults = meetingResult?.raceResults || meetingResult?.races || [];

  const raceResult = Array.isArray(raceResults)
    ? raceResults.find(
        (race: any) => Number(race.raceNumber) === Number(raceNumber)
      ) || raceResults[0]
    : raceResults || meetingResult;

  if (!raceResult) return null;

  return {
    source: "Punting Form",
    raceResult,
  };
}

async function fetchRacingApiRaceResult(
  date: string,
  course: string,
  raceNumber: number
) {
  const username = process.env.RACING_API_USERNAME;
  const password = process.env.RACING_API_PASSWORD;

  if (!username || !password) return null;

  const auth = Buffer.from(`${username}:${password}`).toString("base64");

  const meetsRes = await fetch(
    "https://api.theracingapi.com/v1/australia/meets",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const meetsData = await meetsRes.json();

  if (!meetsRes.ok) return null;

  const savedCourse = normaliseText(course);

  const meet = (meetsData?.meets || []).find((meet: any) => {
    const apiCourse = normaliseText(meet.course || "");

    return (
      meet.date === date &&
      (apiCourse.includes(savedCourse) || savedCourse.includes(apiCourse))
    );
  });

  if (!meet) return null;

  const racesRes = await fetch(
    `https://api.theracingapi.com/v1/australia/meets/${meet.meet_id}/races`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const racesData = await racesRes.json();

  if (!racesRes.ok) return null;

  const raceResult = (racesData?.races || []).find((race: any) => {
    return Number(race.race_number) === Number(raceNumber);
  });

  if (!raceResult) return null;

  return {
    source: "The Racing API",
    raceResult,
  };
}

function getRaceRunners(raceResult: any) {
  return raceResult?.runners || raceResult?.results || [];
}

function findMatchedRunner(runners: any[], pick: any) {
  return runners.find((runner: any) => {
    const runnerName =
      runner.runner ||
      runner.name ||
      runner.horse ||
      runner.horseName ||
      "";

    const runnerNumber =
      runner.tabNo ||
      runner.number ||
      runner.runnerNumber ||
      runner.horse_number;

    return (
      normaliseText(runnerName) === normaliseText(pick.horse_name) ||
      Number(runnerNumber) === Number(pick.horse_number)
    );
  });
}

async function getStrategySettings() {
  const { data, error } = await supabase
    .from("strategy_settings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error) {
    throw new Error(`Strategy settings error: ${error.message}`);
  }

  return data;
}

async function updateStrategyBank(strategyId: string, newBank: number) {
  const { error } = await supabase
    .from("strategy_settings")
    .update({
      current_bank: Number(newBank.toFixed(2)),
    })
    .eq("id", strategyId);

  if (error) {
    throw new Error(`Failed to update strategy bank: ${error.message}`);
  }
}

export async function GET() {
  try {
    const today = getMelbourneDate();

    const strategy = await getStrategySettings();

    let runningBank = Number(
      strategy.current_bank || strategy.starting_bank || 1000
    );

    const betPercentage = Number(strategy.bet_percentage || 10);

    const { data: pendingPicks, error: pendingError } = await supabase
      .from("saved_picks")
      .select("*")
      .in("result", ["pending", "needs_dividend"])
      .lte("race_date", today)
      .order("race_date", { ascending: true })
      .order("race_time", { ascending: true })
      .limit(100);

    if (pendingError) {
      return NextResponse.json({
        ok: false,
        error: pendingError.message,
      });
    }

    const updated: any[] = [];
    const notReady: any[] = [];
    const failed: any[] = [];

    for (const pick of pendingPicks || []) {
      try {
        let resultSource = "Punting Form";

        let resultData = await fetchPuntingFormRaceResult(
          pick.race_date,
          pick.course,
          Number(pick.race_number)
        );

        let runners = resultData ? getRaceRunners(resultData.raceResult) : [];

        let matchedRunner = Array.isArray(runners)
          ? findMatchedRunner(runners, pick)
          : null;

        let position = matchedRunner ? getRunnerPosition(matchedRunner) : null;

        if (!matchedRunner || !position) {
          resultData = await fetchRacingApiRaceResult(
            pick.race_date,
            pick.course,
            Number(pick.race_number)
          );

          resultSource = "The Racing API";

          runners = resultData ? getRaceRunners(resultData.raceResult) : [];

          matchedRunner = Array.isArray(runners)
            ? findMatchedRunner(runners, pick)
            : null;

          position = matchedRunner ? getRunnerPosition(matchedRunner) : null;
        }

        if (
          !resultData?.raceResult ||
          !Array.isArray(runners) ||
          runners.length === 0
        ) {
          notReady.push({
            id: pick.id,
            course: pick.course,
            race_number: pick.race_number,
            horse_name: pick.horse_name,
            reason: "No race result found from Punting Form or The Racing API",
          });
          continue;
        }

        if (!matchedRunner) {
          notReady.push({
            id: pick.id,
            course: pick.course,
            race_number: pick.race_number,
            horse_name: pick.horse_name,
            reason: "Runner not found in result",
          });
          continue;
        }

        const scratched = isScratchedRunner(matchedRunner);

        const bankBeforeBet = runningBank;
        const betSize = Number(
          (bankBeforeBet * (betPercentage / 100)).toFixed(2)
        );

        let resultValue = "pending";
        let placed: boolean | null = null;
        let profitLoss: number | null = null;
        let dividend: number | null = getRunnerDividend(matchedRunner);
        let bankAfterBet = bankBeforeBet;
        let settlementStatus = "pending";

        if (scratched) {
          resultValue = "scratched";
          placed = null;
          profitLoss = 0;
          dividend = null;
          bankAfterBet = bankBeforeBet;
          settlementStatus = "void";
        } else if (position) {
          resultValue = String(position);
          placed = position <= 3;

          if (placed && dividend) {
            profitLoss = money(betSize * dividend - betSize);
          } else if (placed && !dividend) {
            profitLoss = null;
          } else {
            profitLoss = money(0 - betSize);
          }

          if (profitLoss !== null) {
            bankAfterBet = money(bankBeforeBet + profitLoss);
            runningBank = bankAfterBet;
            settlementStatus = "settled";
          } else {
            bankAfterBet = bankBeforeBet;
            settlementStatus = "needs_dividend";
          }
        } else {
          notReady.push({
            id: pick.id,
            course: pick.course,
            race_number: pick.race_number,
            horse_name: pick.horse_name,
            reason: "No finishing position found",
          });
          continue;
        }

        const { error: updateError } = await supabase
          .from("saved_picks")
          .update({
            result: resultValue,
            placed,
            bet_size: betSize,
            profit_loss: profitLoss,
            bank_start: Number(strategy.starting_bank || 1000),
            bet_percentage: betPercentage,
            bank_before_bet: Number(bankBeforeBet.toFixed(2)),
            bank_after_bet: Number(bankAfterBet.toFixed(2)),
            dividend: placed === true ? dividend : null,
place_dividend: placed === true ? dividend : null,
            return_amount:
              profitLoss !== null
                ? Number((betSize + profitLoss).toFixed(2))
                : null,
            running_bank: Number(bankAfterBet.toFixed(2)),
            settlement_status: settlementStatus,
          })
          .eq("id", pick.id);

        if (updateError) {
          failed.push({
            id: pick.id,
            reason: updateError.message,
          });
          continue;
        }

        if (settlementStatus === "settled" || settlementStatus === "void") {
          await updateStrategyBank(strategy.id, runningBank);
        }

        updated.push({
          id: pick.id,
          source: resultSource,
          course: pick.course,
          race_number: pick.race_number,
          horse_name: pick.horse_name,
          result: resultValue,
          placed,
          bet_size: betSize,
          dividend,
          profit_loss: profitLoss,
          bank_before_bet: Number(bankBeforeBet.toFixed(2)),
          bank_after_bet: Number(bankAfterBet.toFixed(2)),
          settlement_status: settlementStatus,
        });
      } catch (error) {
        failed.push({
          id: pick.id,
          course: pick.course,
          race_number: pick.race_number,
          horse_name: pick.horse_name,
          reason: String(error),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      source: "Punting Form with The Racing API fallback",
      checked: pendingPicks?.length || 0,
      updated,
      notReady,
      failed,
      strategy: {
        starting_bank: Number(strategy.starting_bank || 1000),
        current_bank: Number(runningBank.toFixed(2)),
        bet_percentage: betPercentage,
      },
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: "Failed to update race results",
      details: String(error),
    });
  }
}
