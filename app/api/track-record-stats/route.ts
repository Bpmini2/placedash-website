import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function isVoidPick(pick: any) {
  return (
    pick.result === "abandoned" ||
    pick.result === "scratched" ||
    pick.settlement_status === "void"
  );
}

function isPendingPick(pick: any) {
  return !pick.result || pick.result === "pending";
}

function calculateProfitLoss(pick: any) {
  const betSize = Number(pick.bet_size || 0);
  const dividend = Number(pick.place_dividend || pick.dividend || 0);

  if (isVoidPick(pick)) {
    return 0;
  }

  if (pick.placed === true) {
    return money(betSize * dividend - betSize);
  }

  if (pick.placed === false) {
    return money(0 - betSize);
  }

  return 0;
}

export async function GET() {
  try {
    const { data: picks, error } = await supabase
      .from("saved_picks")
      .select("*")
      .eq("logic_version", "v2_value_bet")
      .order("race_date", { ascending: false })
      .order("race_time", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const allPicks = picks || [];

    const voidPicks = allPicks.filter((pick: any) => isVoidPick(pick));

    const pendingPicks = allPicks.filter(
      (pick: any) => isPendingPick(pick) && !isVoidPick(pick)
    );

    const completedPicks = allPicks.filter(
      (pick: any) =>
        !isPendingPick(pick) &&
        !isVoidPick(pick)
    );

    const placedPicks = completedPicks.filter(
      (pick: any) => pick.placed === true
    );

    const unplacedPicks = completedPicks.filter(
      (pick: any) => pick.placed === false
    );

    const highConfidencePicks = completedPicks.filter(
      (pick: any) => pick.confidence === "HIGH"
    );

    const highConfidencePlaced = highConfidencePicks.filter(
      (pick: any) => pick.placed === true
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

    const totalBetSize = completedPicks.reduce(
      (sum: number, pick: any) => sum + Number(pick.bet_size || 0),
      0
    );

    const totalProfitLoss = money(
      completedPicks.reduce(
        (sum: number, pick: any) => sum + calculateProfitLoss(pick),
        0
      )
    );

    const startingBank = 1000;
    const currentBank = money(startingBank + totalProfitLoss);

    const roi =
      totalBetSize > 0 ? Math.round((totalProfitLoss / totalBetSize) * 100) : 0;

    const last20 = allPicks;

    return NextResponse.json(
      {
        ok: true,
        summary: {
          totalPicks: allPicks.length,
          completedPicks: completedPicks.length,
          pendingPicks: pendingPicks.length,
          placedPicks: placedPicks.length,
          unplacedPicks: unplacedPicks.length,
          voidPicks: voidPicks.length,
          strikeRate,
          highConfidencePicks: highConfidencePicks.length,
          highConfidencePlaced: highConfidencePlaced.length,
          highConfidenceStrikeRate,
          moneySettledPicks: completedPicks.length,
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
