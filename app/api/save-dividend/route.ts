import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function money(value: number) {
  return Math.round(value * 100) / 100;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const id = body.id;
    const result = body.result;
    const placeDividend =
      body.place_dividend === "" || body.place_dividend == null
        ? null
        : Number(body.place_dividend);

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing pick id" }, { status: 400 });
    }

    let updateData: any = {};

    if (result === "Placed") {
      if (!placeDividend || placeDividend <= 0) {
        return NextResponse.json(
          { ok: false, error: "Place dividend required for placed result" },
          { status: 400 }
        );
      }

      updateData = {
        placed: true,
        place_dividend: placeDividend,
        dividend: placeDividend,
        settlement_status: "settled",
      };
    }

    if (result === "Unplaced") {
      updateData = {
        result: "unplaced",
        placed: false,
        place_dividend: null,
        dividend: null,
        return_amount: 0,
        settlement_status: "settled",
      };
    }

    if (result === "Scratched/Void") {
      updateData = {
        result: "scratched",
        placed: null,
        place_dividend: null,
        dividend: null,
        return_amount: 0,
        profit_loss: 0,
        settlement_status: "void",
      };
    }

    if (!updateData.settlement_status) {
      return NextResponse.json({ ok: false, error: "Invalid result selected" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("saved_picks")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    const { data: strategy, error: strategyError } = await supabase
      .from("strategy_settings")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (strategyError) {
      return NextResponse.json({ ok: false, error: strategyError.message }, { status: 500 });
    }

    let runningBank = Number(strategy.starting_bank || 1000);
    const betPercentage = Number(strategy.bet_percentage || 10);

    const { data: settledPicks, error: picksError } = await supabase
      .from("saved_picks")
      .select("*")
      .neq("result", "pending")
      .order("race_date", { ascending: true })
      .order("race_time", { ascending: true })
      .order("created_at", { ascending: true });

    if (picksError) {
      return NextResponse.json({ ok: false, error: picksError.message }, { status: 500 });
    }

    for (const pick of settledPicks || []) {
      const bankBeforeBet = money(runningBank);
      const betSize = money(bankBeforeBet * (betPercentage / 100));

      let returnAmount = 0;
      let profitLoss = 0;
      let bankAfterBet = bankBeforeBet;

      if (pick.settlement_status === "void" || pick.result === "scratched") {
        returnAmount = 0;
        profitLoss = 0;
        bankAfterBet = bankBeforeBet;
      } else if (pick.placed === true) {
        const dividend = Number(pick.place_dividend || pick.dividend || 0);

        if (dividend > 0) {
          returnAmount = money(betSize * dividend);
          profitLoss = money(returnAmount - betSize);
          bankAfterBet = money(bankBeforeBet + profitLoss);
        } else {
          returnAmount = 0;
          profitLoss = 0;
          bankAfterBet = bankBeforeBet;
        }
      } else if (pick.placed === false) {
        returnAmount = 0;
        profitLoss = money(0 - betSize);
        bankAfterBet = money(bankBeforeBet + profitLoss);
      }

      runningBank = bankAfterBet;

      await supabase
        .from("saved_picks")
        .update({
          bet_size: betSize,
          bank_before_bet: bankBeforeBet,
          return_amount: returnAmount,
          profit_loss: profitLoss,
          bank_after_bet: bankAfterBet,
          running_bank: bankAfterBet,
          bank_start: Number(strategy.starting_bank || 1000),
          bet_percentage: betPercentage,
        })
        .eq("id", pick.id);
    }

    await supabase
      .from("strategy_settings")
      .update({
        current_bank: money(runningBank),
      })
      .eq("id", strategy.id);

    return NextResponse.json({
      ok: true,
      id,
      recalculated_bank: money(runningBank),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
