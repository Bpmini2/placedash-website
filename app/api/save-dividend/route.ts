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
      return NextResponse.json(
        { ok: false, error: "Missing pick id" },
        { status: 400 }
      );
    }

    const { data: picks, error: fetchError } = await supabase
      .from("saved_picks")
      .select("*")
      .eq("id", id)
      .limit(1);

    if (fetchError || !picks || picks.length === 0) {
      return NextResponse.json(
        { ok: false, error: fetchError?.message || "Pick not found" },
        { status: 404 }
      );
    }

    const pick = picks[0];

    const betSize = Number(pick.bet_size || 0);
    const bankBeforeBet = Number(
      pick.bank_before_bet || pick.running_bank || 1000
    );

    let updateData: any = {};

    if (result === "Placed") {
      if (!placeDividend || placeDividend <= 0) {
        return NextResponse.json(
          { ok: false, error: "Place dividend required for placed result" },
          { status: 400 }
        );
      }

      const returnAmount = money(betSize * placeDividend);
      const profitLoss = money(returnAmount - betSize);
      const bankAfterBet = money(bankBeforeBet + profitLoss);

      updateData = {
        result: pick.result && pick.result !== "pending" ? pick.result : "placed",
        placed: true,
        place_dividend: placeDividend,
        dividend: placeDividend,
        return_amount: returnAmount,
        profit_loss: profitLoss,
        bank_after_bet: bankAfterBet,
        running_bank: bankAfterBet,
        settlement_status: "settled",
      };
    }

    if (result === "Unplaced") {
      const profitLoss = money(0 - betSize);
      const bankAfterBet = money(bankBeforeBet + profitLoss);

      updateData = {
        result: pick.result && pick.result !== "pending" ? pick.result : "unplaced",
        placed: false,
        place_dividend: null,
        dividend: null,
        return_amount: 0,
        profit_loss: profitLoss,
        bank_after_bet: bankAfterBet,
        running_bank: bankAfterBet,
        settlement_status: "settled",
      };
    }

    if (result === "Scratched/Void") {
      updateData = {
        result: "scratched",
        placed: null,
        place_dividend: null,
        dividend: null,
        return_amount: betSize,
        profit_loss: 0,
        bank_after_bet: bankBeforeBet,
        running_bank: bankBeforeBet,
        settlement_status: "void",
      };
    }

    if (!updateData.result) {
      return NextResponse.json(
        { ok: false, error: "Invalid result selected" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("saved_picks")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    await supabase
      .from("strategy_settings")
      .update({
        current_bank: updateData.bank_after_bet,
      })
      .eq("id", pick.strategy_id);

    return NextResponse.json({
      ok: true,
      id,
      ...updateData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
