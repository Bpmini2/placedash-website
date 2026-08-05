import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getMelbourneDate() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Australia/Melbourne",
  });
}

function toNumber(value: any, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normaliseText(value: any) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function safeKeys(value: any) {
  if (!value || typeof value !== "object") return [];
  return Object.keys(value).slice(0, 60);
}

function getMeetingName(meeting: any) {
  return (
    meeting?.track?.name ||
    meeting?.trackName ||
    meeting?.track_name ||
    meeting?.course ||
    meeting?.courseName ||
    meeting?.course_name ||
    meeting?.venue ||
    meeting?.venueName ||
    meeting?.venue_name ||
    meeting?.meetingName ||
    meeting?.meeting_name ||
    meeting?.name ||
    meeting?.track ||
    ""
  );
}

function courseMatches(apiCourseRaw: string, savedCourseRaw: string) {
  const apiCourse = normaliseText(apiCourseRaw);
  const savedCourse = normaliseText(savedCourseRaw);

  if (!apiCourse || !savedCourse) return false;

  return (
    apiCourse === savedCourse ||
    apiCourse.includes(savedCourse) ||
    savedCourse.includes(apiCourse)
  );
}

function getRunnerName(runner: any) {
  return (
    runner?.runner ||
    runner?.name ||
    runner?.horse ||
    runner?.horseName ||
    runner?.horse_name ||
    runner?.runnerName ||
    runner?.runner_name ||
    ""
  );
}

function getRunnerNumber(runner: any) {
  return (
    runner?.tabNo ??
    runner?.tab_no ??
    runner?.number ??
    runner?.runnerNumber ??
    runner?.runner_number ??
    runner?.horse_number ??
    runner?.saddlecloth ??
    runner?.cloth_number ??
    null
  );
}

function getPositionCandidates(runner: any) {
  return [
    runner?.position,
    runner?.pos,
    runner?.finishingPosition,
    runner?.finishing_position,
    runner?.finishPosition,
    runner?.finish_position,
    runner?.finishedPosition,
    runner?.finished_position,
    runner?.result,
    runner?.result_position,
    runner?.resultPosition,
    runner?.place,
    runner?.placing,
    runner?.placingNumber,
    runner?.placing_number,
    runner?.officialPosition,
    runner?.official_position,
    runner?.finish,
    runner?.finishing,
    runner?.result?.position,
    runner?.result?.pos,
    runner?.result?.finishingPosition,
    runner?.result?.finishing_position,
    runner?.result?.place,
    runner?.result?.placing,
  ];
}

function getRunnerPosition(runner: any) {
  const rawPosition = getPositionCandidates(runner).find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== ""
  );

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

function isAbandonedRace(raceResult: any) {
  const statusText = String(
    raceResult?.race_status ||
      raceResult?.status ||
      raceResult?.result ||
      raceResult?.raceStatus ||
      raceResult?.race_status_text ||
      raceResult?.state ||
      ""
  ).toLowerCase();

  return (
    statusText.includes("abnd") ||
    statusText.includes("aband") ||
    statusText.includes("abandoned") ||
    statusText.includes("void")
  );
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
    return courseMatches(getMeetingName(meeting), course);
  });

  return matched?.meetingId || matched?.meeting_id || matched?.id || null;
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

  const raceResults =
    meetingResult?.raceResults ||
    meetingResult?.races ||
    meetingResult?.results ||
    [];

  const raceResult = Array.isArray(raceResults)
    ? raceResults.find((race: any) => {
        const apiRaceNumber =
          race?.raceNumber ??
          race?.race_number ??
          race?.number ??
          race?.race_no ??
          race?.raceNo;

        return Number(apiRaceNumber) === Number(raceNumber);
      }) || raceResults[0]
    : raceResults || meetingResult;

  if (!raceResult) return null;

  return {
    source: "Punting Form",
    raceResult,
  };
}

async function getRacingApiMeets(date: string) {
  const username = process.env.RACING_API_USERNAME;
  const password = process.env.RACING_API_PASSWORD;

  if (!username || !password) return [];

  const auth = Buffer.from(`${username}:${password}`).toString("base64");

  const meetsRes = await fetch(
    `https://api.theracingapi.com/v1/australia/meets?date=${date}`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const meetsData = await meetsRes.json();

  if (!meetsRes.ok) return [];

  return meetsData?.meets || meetsData?.meetings || [];
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

  const meets = await getRacingApiMeets(date);

  const meet = (meets || []).find((meet: any) => {
    const apiCourseRaw =
      meet?.course ||
      meet?.course_name ||
      meet?.courseName ||
      meet?.track ||
      meet?.track_name ||
      meet?.trackName ||
      meet?.venue ||
      meet?.venue_name ||
      meet?.venueName ||
      meet?.name ||
      meet?.meeting_name ||
      meet?.meetingName ||
      "";

    const apiDateRaw =
      meet?.date ||
      meet?.meet_date ||
      meet?.meeting_date ||
      meet?.race_date ||
      date ||
      "";

    const apiDate = String(apiDateRaw).slice(0, 10);

    return apiDate === date && courseMatches(apiCourseRaw, course);
  });

  if (!meet) return null;

  const meetId = meet.meet_id || meet.meeting_id || meet.meetId || meet.id;

  if (!meetId) return null;

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

  if (!racesRes.ok) return null;

  const raceResult = (racesData?.races || racesData?.results || []).find(
    (race: any) => {
      const apiRaceNumber =
        race?.race_number ??
        race?.raceNumber ??
        race?.number ??
        race?.race_no ??
        race?.raceNo;

      return Number(apiRaceNumber) === Number(raceNumber);
    }
  );

  if (!raceResult) return null;

  return {
    source: "The Racing API",
    raceResult,
  };
}

function getRaceRunners(raceResult: any) {
  return (
    raceResult?.runners ||
    raceResult?.results ||
    raceResult?.runnerResults ||
    raceResult?.runner_results ||
    raceResult?.finalPlacings ||
    raceResult?.final_placings ||
    raceResult?.placings ||
    raceResult?.horses ||
    []
  );
}

function findMatchedRunner(runners: any[], pick: any) {
  const savedHorse =
    pick.favourite_horse ||
    pick.horse_name ||
    pick.horse ||
    pick.runner_name ||
    "";

  const horseNameMatch = runners.find((runner: any) => {
    return normaliseText(getRunnerName(runner)) === normaliseText(savedHorse);
  });

  if (horseNameMatch) return horseNameMatch;

  return runners.find((runner: any) => {
    return Number(getRunnerNumber(runner)) === Number(pick.horse_number);
  });
}

function settleFavouriteSplitPick(
  pick: any,
  status: string,
  position: number | null
) {
  const bankBeforeBet = toNumber(pick.bank_before_bet, 1000);
  const totalStake = toNumber(pick.total_stake, bankBeforeBet * 0.1);
  const winStake = toNumber(pick.win_stake, totalStake * 0.25);
  const placeStake = toNumber(pick.place_stake, totalStake * 0.75);
  const winOdds = toNumber(pick.win_odds, 0);
  const placeOdds = toNumber(pick.place_odds, 0);

  let winReturn = 0;
  let placeReturn = 0;
  let totalReturn = 0;
  let profitLoss = 0;
  let bankAfterBet = bankBeforeBet;
  let settlementStatus = "pending";

  if (status === "pending") {
    return {
      status: "pending",
      settlement_status: "pending",
      finish_position: position,
      win_return: 0,
      place_return: 0,
      total_return: 0,
      profit_loss: 0,
      bank_after_bet: roundMoney(bankBeforeBet),
    };
  }

  if (status === "scratched" || status === "abandoned") {
    totalReturn = totalStake;
    profitLoss = 0;
    bankAfterBet = bankBeforeBet;
    settlementStatus = "void";

    return {
      status,
      settlement_status: settlementStatus,
      finish_position: position,
      win_return: 0,
      place_return: 0,
      total_return: roundMoney(totalReturn),
      profit_loss: roundMoney(profitLoss),
      bank_after_bet: roundMoney(bankAfterBet),
    };
  }

  settlementStatus = "settled";

  if (status === "won") {
    winReturn = winStake * winOdds;
    placeReturn = placeStake * placeOdds;
    totalReturn = winReturn + placeReturn;
    profitLoss = totalReturn - totalStake;
    bankAfterBet = bankBeforeBet + profitLoss;
  }

  if (status === "placed") {
    winReturn = 0;
    placeReturn = placeStake * placeOdds;
    totalReturn = placeReturn;
    profitLoss = totalReturn - totalStake;
    bankAfterBet = bankBeforeBet + profitLoss;
  }

  if (status === "unplaced") {
    winReturn = 0;
    placeReturn = 0;
    totalReturn = 0;
    profitLoss = -totalStake;
    bankAfterBet = bankBeforeBet + profitLoss;
  }

  return {
    status,
    settlement_status: settlementStatus,
    finish_position: position,
    win_return: roundMoney(winReturn),
    place_return: roundMoney(placeReturn),
    total_return: roundMoney(totalReturn),
    profit_loss: roundMoney(profitLoss),
    bank_after_bet: roundMoney(bankAfterBet),
  };
}

function getResultStatus(position: number | null, scratched: boolean) {
  if (scratched) return "scratched";
  if (!position) return "pending";
  if (position === 1) return "won";
  if (position <= 3) return "placed";
  return "unplaced";
}

function buildDebugInfo(params: {
  pick: any;
  resultData: any;
  runners: any[];
  matchedRunner: any;
  position: number | null;
  resultSource: string;
}) {
  const { pick, resultData, runners, matchedRunner, position, resultSource } =
    params;

  return {
    result_source_used: resultSource,
    race_result_found: Boolean(resultData?.raceResult),
    race_result_keys: safeKeys(resultData?.raceResult),
    runner_count: Array.isArray(runners) ? runners.length : 0,
    matched_runner_found: Boolean(matchedRunner),
    matched_runner_keys: safeKeys(matchedRunner),
    matched_runner_name: matchedRunner ? getRunnerName(matchedRunner) : null,
    matched_runner_number: matchedRunner ? getRunnerNumber(matchedRunner) : null,
    position,
    raw_position_candidates: matchedRunner
      ? getPositionCandidates(matchedRunner).map((value) =>
          value === undefined || value === null ? null : String(value)
        )
      : [],
    available_runners: Array.isArray(runners)
      ? runners.slice(0, 12).map((runner: any) => ({
          name: getRunnerName(runner),
          number: getRunnerNumber(runner),
          keys: safeKeys(runner).slice(0, 20),
        }))
      : [],
    saved_pick: {
      id: pick.id,
      course: pick.course,
      race_number: pick.race_number,
      race_date: pick.race_date,
      favourite_horse: pick.favourite_horse,
      horse_number: pick.horse_number,
      status: pick.status,
      strategy_version: pick.strategy_version,
    },
  };
}

function buildReport() {
  return {
    checked: 0,
    updated: 0,
    won: 0,
    placed: 0,
    unplaced: 0,
    scratched: 0,
    abandoned: 0,
    notReady: 0,
    failed: 0,
  };
}

async function getPendingFavouriteSplitPicks(today: string) {
  const { data, error } = await supabase
    .from("favourite_split_picks")
    .select("*")
    .eq("strategy_version", "v3_favourite_split")
    .eq("status", "pending")
    .lte("race_date", today)
    .order("race_date", { ascending: true })
    .order("race_time", { ascending: true })
    .limit(150);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

async function runAutoUpdateResults(debugMode: boolean) {
  const today = getMelbourneDate();
  const pendingPicks = await getPendingFavouriteSplitPicks(today);

  const report = buildReport();
  const updated: any[] = [];
  const notReady: any[] = [];
  const failed: any[] = [];

  report.checked = pendingPicks.length;

  for (const pick of pendingPicks) {
    try {
      let resultSource = "The Racing API";

      let resultData = await fetchRacingApiRaceResult(
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
        const puntingFormResultData = await fetchPuntingFormRaceResult(
          pick.race_date,
          pick.course,
          Number(pick.race_number)
        );

        if (puntingFormResultData?.raceResult) {
          resultData = puntingFormResultData;
          resultSource = "Punting Form";

          runners = getRaceRunners(resultData.raceResult);

          matchedRunner = Array.isArray(runners)
            ? findMatchedRunner(runners, pick)
            : null;

          position = matchedRunner ? getRunnerPosition(matchedRunner) : null;
        }
      }

      const abandonedRace = resultData?.raceResult
        ? isAbandonedRace(resultData.raceResult)
        : false;

      if (abandonedRace) {
        const settlement = settleFavouriteSplitPick(pick, "abandoned", null);

        const { error: updateError } = await supabase
          .from("favourite_split_picks")
          .update({
            ...settlement,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pick.id);

        if (updateError) {
          failed.push({
            id: pick.id,
            reason: updateError.message,
          });
          report.failed += 1;
          continue;
        }

        updated.push({
          id: pick.id,
          source: resultSource,
          course: pick.course,
          race_number: pick.race_number,
          favourite_horse: pick.favourite_horse,
          horse_number: pick.horse_number,
          status: "abandoned",
          finish_position: null,
          profit_loss: settlement.profit_loss,
          bank_after_bet: settlement.bank_after_bet,
          settlement_status: settlement.settlement_status,
        });

        report.updated += 1;
        report.abandoned += 1;
        continue;
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
          favourite_horse: pick.favourite_horse,
          horse_number: pick.horse_number,
          reason: "No race result found from Punting Form or The Racing API",
          debug: debugMode
            ? buildDebugInfo({
                pick,
                resultData,
                runners,
                matchedRunner,
                position,
                resultSource,
              })
            : undefined,
        });
        report.notReady += 1;
        continue;
      }

      if (!matchedRunner) {
        notReady.push({
          id: pick.id,
          course: pick.course,
          race_number: pick.race_number,
          favourite_horse: pick.favourite_horse,
          horse_number: pick.horse_number,
          reason: "Runner not found in result",
          debug: debugMode
            ? buildDebugInfo({
                pick,
                resultData,
                runners,
                matchedRunner,
                position,
                resultSource,
              })
            : undefined,
        });
        report.notReady += 1;
        continue;
      }

      const scratched = isScratchedRunner(matchedRunner);

      if (!scratched && !position) {
        notReady.push({
          id: pick.id,
          course: pick.course,
          race_number: pick.race_number,
          favourite_horse: pick.favourite_horse,
          horse_number: pick.horse_number,
          reason: "No finishing position found",
          debug: debugMode
            ? buildDebugInfo({
                pick,
                resultData,
                runners,
                matchedRunner,
                position,
                resultSource,
              })
            : undefined,
        });
        report.notReady += 1;
        continue;
      }

      const status = getResultStatus(position, scratched);
      const settlement = settleFavouriteSplitPick(pick, status, position);

      const { error: updateError } = await supabase
        .from("favourite_split_picks")
        .update({
          ...settlement,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pick.id);

      if (updateError) {
        failed.push({
          id: pick.id,
          course: pick.course,
          race_number: pick.race_number,
          favourite_horse: pick.favourite_horse,
          reason: updateError.message,
        });
        report.failed += 1;
        continue;
      }

      if (status === "won") report.won += 1;
      if (status === "placed") report.placed += 1;
      if (status === "unplaced") report.unplaced += 1;
      if (status === "scratched") report.scratched += 1;

      report.updated += 1;

      updated.push({
        id: pick.id,
        source: resultSource,
        course: pick.course,
        race_number: pick.race_number,
        favourite_horse: pick.favourite_horse,
        horse_number: pick.horse_number,
        status,
        finish_position: settlement.finish_position,
        win_return: settlement.win_return,
        place_return: settlement.place_return,
        total_return: settlement.total_return,
        profit_loss: settlement.profit_loss,
        bank_after_bet: settlement.bank_after_bet,
        settlement_status: settlement.settlement_status,
      });
    } catch (error: any) {
      failed.push({
        id: pick.id,
        course: pick.course,
        race_number: pick.race_number,
        favourite_horse: pick.favourite_horse,
        reason: error.message || String(error),
      });
      report.failed += 1;
    }
  }

  return {
    today,
    report,
    updated,
    notReady,
    failed,
  };
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const debugMode = url.searchParams.get("debug") === "1";
    const result = await runAutoUpdateResults(debugMode);

    return NextResponse.json({
      ok: true,
      source: "Punting Form with The Racing API fallback",
      strategy_version: "v3_favourite_split",
      ...result,
      debug_mode: debugMode,
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: "Failed to auto update Favourite Split results",
      details: error.message || String(error),
    });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const debugMode = url.searchParams.get("debug") === "1";
    const result = await runAutoUpdateResults(debugMode);

    return NextResponse.json({
      ok: true,
      source: "Punting Form with The Racing API fallback",
      strategy_version: "v3_favourite_split",
      ...result,
      debug_mode: debugMode,
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: "Failed to auto update Favourite Split results",
      details: error.message || String(error),
    });
  }
}
