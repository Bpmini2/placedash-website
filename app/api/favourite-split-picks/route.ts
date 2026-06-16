import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function toNumber(value: any, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function calculateSettlement(pick: any) {
  const bankBeforeBet = toNumber(pick.bank_before_bet, 1000);
  const totalStake = toNumber(pick.total_stake, bankBeforeBet * 0.1);
  const winStake = toNumber(pick.win_stake, totalStake * 0.25);
  const placeStake = toNumber(pick.place_stake, totalStake * 0.75);
  const winOdds = toNumber(pick.win_odds, 0);
  const placeOdds = toNumber(pick.place_odds, 0);
  const finishPosition =
    pick.finish_position === null || pick.finish_position === undefined
      ? null
      : toNumber(pick.finish_position, 0);

  let winReturn = 0;
  let placeReturn = 0;
  let totalReturn = 0;
  let profitLoss = 0;
  let bankAfterBet = bankBeforeBet;
  let status = pick.status || "pending";

  if (!finishPosition || status === "pending") {
    return {
      bank_before_bet: bankBeforeBet,
      total_stake: totalStake,
      win_stake: winStake,
      place_stake: placeStake,
      win_return: 0,
      place_return: 0,
      total_return: 0,
      profit_loss: 0,
      bank_after_bet: bankBeforeBet,
      status: status || "pending",
    };
  }

  if (finishPosition === 1) {
    status = "won";
    winReturn = winStake * winOdds;
    placeReturn = placeStake * placeOdds;
    totalReturn = winReturn + placeReturn;
    profitLoss = totalReturn - totalStake;
    bankAfterBet = bankBeforeBet + profitLoss;
  } else if (finishPosition === 2 || finishPosition === 3) {
    status = "placed";
    winReturn = 0;
    placeReturn = placeStake * placeOdds;
    totalReturn = placeReturn;
    profitLoss = totalReturn - totalStake;
    bankAfterBet = bankBeforeBet + profitLoss;
  } else {
    status = "unplaced";
    winReturn = 0;
    placeReturn = 0;
    totalReturn = 0;
    profitLoss = -totalStake;
    bankAfterBet = bankBeforeBet + profitLoss;
  }

  return {
    bank_before_bet: bankBeforeBet,
    total_stake: totalStake,
    win_stake: winStake,
    place_stake: placeStake,
    win_return: winReturn,
    place_return: placeReturn,
    total_return: totalReturn,
    profit_loss: profitLoss,
    bank_after_bet: bankAfterBet,
    status,
  };
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("favourite_split_picks")
      .select("*")
      .eq("strategy_version", "v3_favourite_split")
      .order("race_date", { ascending: false })
      .order("race_number", { ascending: false });

    if (error) {
      return NextResponse.json({
        ok: false,
        error: error.message,
      });
    }

    const picks = data || [];

    const completed = picks.filter((pick) =>
      ["won", "placed", "unplaced"].includes(pick.status)
    );

    const wins = picks.filter((pick) => pick.status === "won");
    const places = picks.filter(
      (pick) => pick.status === "won" || pick.status === "placed"
    );

    const totalStake = picks.reduce(
      (sum, pick) => sum + toNumber(pick.total_stake),
      0
    );

    const totalProfitLoss = picks.reduce(
      (sum, pick) => sum + toNumber(pick.profit_loss),
      0
    );

    const startingBank = picks.length
      ? toNumber(picks[picks.length - 1].bank_before_bet, 1000)
      : 1000;

    const currentBank = picks.length
      ? toNumber(picks[0].bank_after_bet, startingBank)
      : startingBank;

    const avgWinOdds =
      picks.length > 0
        ? picks.reduce((sum, pick) => sum + toNumber(pick.win_odds), 0) /
          picks.length
        : 0;

    const avgPlaceOdds =
      picks.length > 0
        ? picks.reduce((sum, pick) => sum + toNumber(pick.place_odds), 0) /
          picks.length
        : 0;

    const summary = {
      startingBank,
      currentBank,
      totalBets: picks.length,
      completedBets: completed.length,
      pendingBets: picks.filter((pick) => pick.status === "pending").length,
      wins: wins.length,
      places: places.length,
      winStrikeRate:
        completed.length > 0
          ? Math.round((wins.length / completed.length) * 100)
          : 0,
      placeStrikeRate:
        completed.length > 0
          ? Math.round((places.length / completed.length) * 100)
          : 0,
      totalProfitLoss,
      roi: totalStake > 0 ? Math.round((totalProfitLoss / totalStake) * 100) : 0,
      averageWinOdds: Number(avgWinOdds.toFixed(2)),
      averagePlaceOdds: Number(avgPlaceOdds.toFixed(2)),
    };

    return NextResponse.json({
      ok: true,
      total: picks.length,
      summary,
      picks,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message || "Unknown error",
    });
  }
}

export async function POST(request: Request) {
  try {
    const pick = await request.json();

    const raceDate =
      pick.race_date ||
      new Date().toLocaleDateString("en-CA", {
        timeZone: "Australia/Melbourne",
      });

    const course = pick.course;
    const raceNumber = pick.race_number || pick.raceNumber;

    const bankBeforeBet = toNumber(pick.bank_before_bet, 1000);
    const totalStake = toNumber(pick.total_stake, bankBeforeBet * 0.1);
    const winStake = toNumber(pick.win_stake, totalStake * 0.25);
    const placeStake = toNumber(pick.place_stake, totalStake * 0.75);

    const settlement = calculateSettlement({
      ...pick,
      bank_before_bet: bankBeforeBet,
      total_stake: totalStake,
      win_stake: winStake,
      place_stake: placeStake,
    });

    const insertPayload = {
      race_date: raceDate,
      course,
      race_number: raceNumber,
      race_time: pick.race_time || pick.off_time || pick.raceTime || null,
      state: pick.state || null,

      favourite_horse: pick.favourite_horse || pick.horse_name || pick.horse,
      horse_number: pick.horse_number || pick.number || null,

      win_odds: pick.win_odds || null,
      place_odds: pick.place_odds || null,

      bank_before_bet: bankBeforeBet,
      total_stake: totalStake,
      win_stake: winStake,
      place_stake: placeStake,

      finish_position: pick.finish_position || null,
      status: settlement.status,

      win_return: settlement.win_return,
      place_return: settlement.place_return,
      total_return: settlement.total_return,
      profit_loss: settlement.profit_loss,
      bank_after_bet: settlement.bank_after_bet,

      strategy_version: "v3_favourite_split",
      source: "admin_favourite_split",

      race_card_json: pick.race_card_json || pick.race?.runners || null,
    };

    const { data: existingPick } = await supabase
      .from("favourite_split_picks")
      .select("id")
      .eq("race_date", raceDate)
      .eq("course", course)
      .eq("race_number", raceNumber)
      .maybeSingle();

    if (existingPick) {
      const { data, error } = await supabase
        .from("favourite_split_picks")
        .update({
          ...insertPayload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPick.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({
          ok: false,
          error: error.message,
        });
      }

      return NextResponse.json({
        ok: true,
        updated: true,
        pick: data,
      });
    }

    const { data, error } = await supabase
      .from("favourite_split_picks")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        ok: false,
        error: error.message,
      });
    }

    return NextResponse.json({
      ok: true,
      saved: true,
      pick: data,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message || "Unknown error",
    });
  }
}
