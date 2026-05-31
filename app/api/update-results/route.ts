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
    (value) => value !== undefined && value !== null && String(value).trim() !== ""
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
function getRunnerDividend(runner: any) {
  const directDividend =
    runner.place_dividend ??
    runner.placeDividend ??
    runner.place_odds ??
    runner.placeOdds ??
    runner.place_price ??
    runner.placePrice ??
    runner.dividend ??
    runner.tote_place ??
    runner.totePlace ??
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

async function getRacingApiMeets() {
  const username = process.env.RACING_API_USERNAME;
  const password = process.env.RACING_API_PASSWORD;

  if (!username || !password) return [];

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

  if (!meetsRes.ok) return [];

  return meetsData?.meets || [];
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

  const meets = await getRacingApiMeets();

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
      "";

    const apiDate = String(apiDateRaw).slice(0, 10);

    return apiDate === date && courseMatches(apiCourseRaw, course);
  });

  if (!meet) return null;

  const meetId = meet.meet_id || meet.meeting_id || meet.id;

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
  const horseNameMatch = runners.find((runner: any) => {
    return normaliseText(getRunnerName(runner)) === normaliseText(pick.horse_name);
  });

  if (horseNameMatch) return horseNameMatch;

  return runners.find((runner: any) => {
    return Number(getRunnerNumber(runner)) === Number(pick.horse_number);
  });
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
      horse_name: pick.horse_name,
      horse_number: pick.horse_number,
      logic_version: pick.logic_version,
      result: pick.result,
    },
  };
}

async function getApiMeetingDebug(date: string, course: string) {
  const puntingFormMeetings = await getPuntingFormMeetings(date);
  const racingApiMeets = await getRacingApiMeets();

  return {
    punting_form_meetings: puntingFormMeetings.slice(0, 40).map((meeting: any) => ({
      name: getMeetingName(meeting),
      meeting_id: meeting?.meetingId || meeting?.meeting_id || meeting?.id || null,
      keys: safeKeys(meeting).slice(0, 20),
      course_match: courseMatches(getMeetingName(meeting), course),
    })),
    racing_api_meets: racingApiMeets.slice(0, 40).map((meet: any) => {
      const courseName =
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
        "";

      return {
        name: courseName,
        date: String(apiDateRaw).slice(0, 10),
        meet_id: meet?.meet_id || meet?.meeting_id || meet?.id || null,
        keys: safeKeys(meet).slice(0, 20),
        course_match: courseMatches(courseName, course),
        date_match: String(apiDateRaw).slice(0, 10) === date,
      };
    }),
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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const debugMode = url.searchParams.get("debug") === "1";
    const today = getMelbourneDate();

    const strategy = await getStrategySettings();

    let runningBank = Number(
      strategy.current_bank || strategy.starting_bank || 1000
    );

    const betPercentage = Number(strategy.bet_percentage || 10);

    const pendingResultQuery = supabase
  .from("saved_picks")
  .select("*")
  .eq("logic_version", "v2_value_bet")
  .in("result", ["pending", "needs_dividend"])
  .lte("race_date", today)
  .order("race_date", { ascending: true })
  .order("race_time", { ascending: true })
  .limit(100);

const needsDividendQuery = supabase
  .from("saved_picks")
  .select("*")
  .eq("logic_version", "v2_value_bet")
  .eq("settlement_status", "needs_dividend")
  .lte("race_date", today)
  .order("race_date", { ascending: true })
  .order("race_time", { ascending: true })
  .limit(100);

const [
  { data: pendingResultPicks, error: pendingResultError },
  { data: needsDividendPicks, error: needsDividendError },
] = await Promise.all([pendingResultQuery, needsDividendQuery]);

const pendingError = pendingResultError || needsDividendError;

const pendingPicks = Array.from(
  new Map(
    [...(pendingResultPicks || []), ...(needsDividendPicks || [])].map(
      (pick: any) => [pick.id, pick]
    )
  ).values()
);

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
          const racingApiResultData = await fetchRacingApiRaceResult(
            pick.race_date,
            pick.course,
            Number(pick.race_number)
          );

          if (racingApiResultData?.raceResult) {
            resultData = racingApiResultData;
            resultSource = "The Racing API";

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
  const bankBeforeBet = runningBank;
  const betSize = Number(
    (bankBeforeBet * (betPercentage / 100)).toFixed(2)
  );

  const { error: updateError } = await supabase
    .from("saved_picks")
    .update({
      result: "abandoned",
      placed: null,
      bet_size: betSize,
      profit_loss: 0,
      bank_start: Number(strategy.starting_bank || 1000),
      bet_percentage: betPercentage,
      bank_before_bet: Number(bankBeforeBet.toFixed(2)),
      bank_after_bet: Number(bankBeforeBet.toFixed(2)),
      dividend: null,
      place_dividend: null,
      return_amount: betSize,
      running_bank: Number(bankBeforeBet.toFixed(2)),
      settlement_status: "void",
    })
    .eq("id", pick.id);

  if (updateError) {
    failed.push({
      id: pick.id,
      reason: updateError.message,
    });
    continue;
  }

  updated.push({
    id: pick.id,
    source: resultSource,
    course: pick.course,
    race_number: pick.race_number,
    horse_name: pick.horse_name,
    result: "abandoned",
    placed: null,
    bet_size: betSize,
    dividend: null,
    profit_loss: 0,
    bank_before_bet: Number(bankBeforeBet.toFixed(2)),
    bank_after_bet: Number(bankBeforeBet.toFixed(2)),
    settlement_status: "void",
    reason: "Race abandoned - void/no bet",
  });

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
            horse_name: pick.horse_name,
            logic_version: pick.logic_version,
            reason: "No race result found from Punting Form or The Racing API",
            debug: debugMode
              ? {
                  ...(await getApiMeetingDebug(pick.race_date, pick.course)),
                }
              : undefined,
          });
          continue;
        }

        if (!matchedRunner) {
          notReady.push({
            id: pick.id,
            course: pick.course,
            race_number: pick.race_number,
            horse_name: pick.horse_name,
            logic_version: pick.logic_version,
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
            logic_version: pick.logic_version,
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
          logic_version: pick.logic_version,
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
          logic_version: pick.logic_version,
          reason: String(error),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      source: "Punting Form with The Racing API fallback",
      official_logic_version: "v2_value_bet",
      checked: pendingPicks?.length || 0,
      updated,
      notReady,
      failed,
      strategy: {
        starting_bank: Number(strategy.starting_bank || 1000),
        current_bank: Number(runningBank.toFixed(2)),
        bet_percentage: betPercentage,
      },
      debug_mode: debugMode,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: "Failed to update race results",
      details: String(error),
    });
  }
}
