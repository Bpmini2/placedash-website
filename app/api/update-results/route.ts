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

function getRunnerDividend(runner: any) {
  return null;
}

function isScratchedRunner(runner: any) {
  const statusText = String(
  
    runner.status ||
      runner.runnerStatus ||
      runner.scratched ||
      runner.inRun ||
      runner.result ||
      ""
  ).toLowerCase();

  return (
    runner.scratched === true ||
    statusText.includes("scr") ||
    statusText.includes("scratch") ||
    statusText.includes("late scratching")
  );
}

async function getPuntingFormMeetings(date: string) {
  const apiKey = process.env.PUNTINGFORM_API_KEY;

  if (!apiKey) {
    throw new Error("PUNTINGFORM_API_KEY is missing");
  }

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

  if (!res.ok || data?.statusCode >= 400) {
    throw new Error(data?.error || "Failed to fetch Punting Form meetings");
  }

  return data?.payLoad || [];
}

async function findPuntingFormMeetingId(date: string, course: string) {
  const meetings = await getPuntingFormMeetings(date);

  const matched = meetings.find((meeting: any) => {
    return normaliseText(meeting?.track?.name || meeting?.name || meeting?.track) === normaliseText(course);
  });

  return matched?.meetingId || null;
}

async function fetchPuntingFormRaceResult(
  date: string,
  course: string,
  raceNumber: number
) {
  const apiKey = process.env.PUNTINGFORM_API_KEY;

  if (!apiKey) {
    throw new Error("PUNTINGFORM_API_KEY is missing");
  }

  const meetingId = await findPuntingFormMeetingId(date, course);

  if (!meetingId) {
    return null;
  }

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

  if (!res.ok || data?.statusCode >= 400) {
    throw new Error(data?.error || "Failed to fetch Punting Form results");
  }

  const meetingResult = Array.isArray(data?.payLoad) ? data.payLoad[0] : data?.payLoad;

  const raceResults = meetingResult?.raceResults || meetingResult?.races || [];

const raceResult = Array.isArray(raceResults)
  ? raceResults.find((race: any) => Number(race.raceNumber) === Number(raceNumber)) ||
    raceResults[0]
  : raceResults || meetingResult;

  return {
    meetingId,
    raceResult,
  };
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

    let runningBank = Number(strategy.current_bank || strategy.starting_bank || 1000);
    const betPercentage = Number(strategy.bet_percentage || 10);

    const { data: pendingPicks, error: pendingError } = await supabase
      .from("saved_picks")
      .select("*")
      .eq("result", "pending")
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
        const puntingFormResult = await fetchPuntingFormRaceResult(
          pick.race_date,
          pick.course,
          Number(pick.race_number)
        );

        if (!puntingFormResult?.raceResult) {
          notReady.push({
            id: pick.id,
            course: pick.course,
            race_number: pick.race_number,
            horse_name: pick.horse_name,
            reason: "No Punting Form race result found yet",
          });
          continue;
        }

        const runners =
          puntingFormResult.raceResult?.runners ||
          puntingFormResult.raceResult?.results ||
          [];

        if (!Array.isArray(runners) || runners.length === 0) {
          notReady.push({
            id: pick.id,
            course: pick.course,
            race_number: pick.race_number,
            horse_name: pick.horse_name,
            reason: "Punting Form result returned no runners",
          });
          continue;
        }

        const matchedRunner = runners.find((runner: any) => {
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

        if (!matchedRunner) {
          failed.push({
            id: pick.id,
            course: pick.course,
            race_number: pick.race_number,
            horse_name: pick.horse_name,
            reason: "Horse not found in Punting Form result",
          });
          continue;
        }

        const scratched = isScratchedRunner(matchedRunner);
        const position = getRunnerPosition(matchedRunner);

        const bankBeforeBet = runningBank;
        const betSize = Number((bankBeforeBet * (betPercentage / 100)).toFixed(2));

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
          settlementStatus = "scratched";
        } else if (position) {
          resultValue = String(position);
          placed = position <= 3;

          if (placed && dividend) {
            profitLoss = Number((betSize * dividend - betSize).toFixed(2));
          } else if (placed && !dividend) {
            profitLoss = null;
          } else {
            profitLoss = -betSize;
          }

          if (profitLoss !== null) {
            bankAfterBet = Number((bankBeforeBet + profitLoss).toFixed(2));
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
            reason: "No finishing position found in Punting Form result",
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
            dividend,
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

        if (settlementStatus === "settled" || settlementStatus === "scratched") {
          await updateStrategyBank(strategy.id, runningBank);
        }

        updated.push({
          id: pick.id,
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
      source: "Punting Form",
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
      error: "Failed to update race results with Punting Form",
      details: String(error),
    });
  }
}
