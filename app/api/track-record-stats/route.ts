import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: picks, error } = await supabase
      .from("saved_picks")
      .select("*")
      .order("race_date", { ascending: false })
      .order("race_time", { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    const allPicks = picks || [];

    const completedPicks = allPicks.filter(
      (pick: any) => pick.result && pick.result !== "pending"
    );

    const placedPicks = completedPicks.filter(
      (pick: any) => pick.placed === true
    );

    const highConfidencePicks = completedPicks.filter(
      (pick: any) => pick.confidence === "HIGH"
    );

    const highConfidencePlaced = highConfidencePicks.filter(
      (pick: any) => pick.placed === true
    );

    const moneySettledPicks = completedPicks.filter(
      (pick: any) => pick.settlement_status === "settled"
    );

    const strikeRate =
      completedPicks.length > 0
        ? Math.round((placedPicks.length / completedPicks.length) * 100)
        : 0;

    const highConfidenceStrikeRate =
      highConfidencePicks.length > 0
        ? Math.round(
            (highConfidencePlaced.length / highConfidencePicks.length) * 100
          )
        : 0;

    const totalBetSize = moneySettledPicks.reduce(
      (sum: number, pick: any) => sum + Number(pick.bet_size || 0),
      0
    );

    const totalProfitLoss = moneySettledPicks.reduce(
      (sum: number, pick: any) => sum + Number(pick.profit_loss || 0),
      0
    );

    const roi =
      totalBetSize > 0 ? Math.round((totalProfitLoss / totalBetSize) * 100) : 0;
    const latestBankPick = [...allPicks]
  .filter((pick: any) => pick.bank_after_bet || pick.running_bank)
  .sort((a: any, b: any) => {
    return new Date(b.race_date).getTime() - new Date(a.race_date).getTime();
  })[0];

const currentBank = Number(
  latestBankPick?.bank_after_bet ||
    latestBankPick?.running_bank ||
    1000
);

    const last20 = allPicks.slice(0, 20);

    return NextResponse.json(
      {
        ok: true,
        summary: {
          totalPicks: allPicks.length,
          completedPicks: completedPicks.length,
          pendingPicks: allPicks.length - completedPicks.length,
          placedPicks: placedPicks.length,
          unplacedPicks: completedPicks.length - placedPicks.length,
          strikeRate,
          highConfidencePicks: highConfidencePicks.length,
          highConfidencePlaced: highConfidencePlaced.length,
          highConfidenceStrikeRate,
          moneySettledPicks: moneySettledPicks.length,
          totalBetSize,
          totalProfitLoss,
          roi,
          currentBank,
        },
        last20,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to build track record stats",
        details: String(error),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
