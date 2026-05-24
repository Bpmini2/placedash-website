import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { id, place_dividend, result } = await request.json();

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing pick id" });
    }

    const { data: pick, error: fetchError } = await supabase
      .from("saved_picks")
      .select("*")
      .eq("id", id)
      .limit(1)
.maybeSingle()
    if (fetchError || !pick) {
      return NextResponse.json({
        ok: false,
        error: fetchError?.message || "Pick not found",
      });
    }

    const betSize = Number(pick.bet_size || 0);
    const bankBeforeBet = Number(pick.bank_before_bet || 1000);

    let updateData: any = {};

    if (result === "scratched") {
      updateData = {
        result: "scratched",
        placed: null,
        return_amount: 0,
        profit_loss: 0,
        bank_after_bet: bankBeforeBet,
        running_bank: bankBeforeBet,
        settlement_result: "void",
      };
    }

    if (result === "unplaced") {
      const profitLoss = Number((-betSize).toFixed(2));
      const bankAfterBet = Number((bankBeforeBet + profitLoss).toFixed(2));

      updateData = {
        placed: false,
        return_amount: 0,
        profit_loss: profitLoss,
        bank_after_bet: bankAfterBet,
        running_bank: bankAfterBet,
        settlement_result: "settled",
      };
    }

    if (result === "placed") {
      if (!place_dividend) {
        return NextResponse.json({
          ok: false,
          error: "Please enter a place dividend for placed runners.",
        });
      }

      const dividend = Number(place_dividend);
      const returnAmount = Number((betSize * dividend).toFixed(2));
      const profitLoss = Number((returnAmount - betSize).toFixed(2));
      const bankAfterBet = Number((bankBeforeBet + profitLoss).toFixed(2));

      updateData = {
        placed: true,
        place_dividend: dividend,
        dividend,
        return_amount: returnAmount,
        profit_loss: profitLoss,
        bank_after_bet: bankAfterBet,
        running_bank: bankAfterBet,
        settlement_result: "settled",
      };
    }

    const { data, error } = await supabase
      .from("saved_picks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message });
    }

    return NextResponse.json({ ok: true, pick: data });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message || "Unknown error",
    });
  }
}
