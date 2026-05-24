import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { id, place_dividend } = await request.json();

    if (!id || !place_dividend) {
      return NextResponse.json({
        ok: false,
        error: "Missing pick id or place dividend",
      });
    }

    const { data: pick, error: fetchError } = await supabase
      .from("saved_picks")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !pick) {
      return NextResponse.json({
        ok: false,
        error: fetchError?.message || "Pick not found",
      });
    }

    const dividend = Number(place_dividend);
    const betSize = Number(pick.bet_size || 0);

    const returnAmount = Number((betSize * dividend).toFixed(2));
    const profitLoss = Number((returnAmount - betSize).toFixed(2));

    const bankBeforeBet = Number(pick.bank_before_bet || 1000);
    const bankAfterBet = Number((bankBeforeBet + profitLoss).toFixed(2));

    const { data, error } = await supabase
      .from("saved_picks")
      .update({
        place_dividend: dividend,
        dividend,
        return_amount: returnAmount,
        profit_loss: profitLoss,
        bank_after_bet: bankAfterBet,
        running_bank: bankAfterBet,
        settlement_status: "settled",
      })
      .eq("id", id)
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
      pick: data,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message || "Unknown error",
    });
  }
}
