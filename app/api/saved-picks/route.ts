import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("saved_picks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({
        ok: false,
        error: error.message,
      });
    }

    return NextResponse.json({
      ok: true,
      total: data?.length || 0,
      picks: data || [],
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
    const raceDate = pick.race_date || new Date().toLocaleDateString("en-CA", {
  timeZone: "Australia/Melbourne",
});

const course = pick.course || pick.race?.course;
const raceNumber = pick.race_number || pick.raceNumber || pick.race?.race_number || pick.race?.raceNumber;

    const { data: existingPick } = await supabase
  .from("saved_picks")
  .select("id")
  .eq("race_date", raceDate)
.eq("course", course)
.eq("race_number", raceNumber)
  .maybeSingle();

    if (existingPick) {
  const { data: updatedPick, error: updateError } = await supabase
    .from("saved_picks")
    .update({
      logic_version: pick.logic_version || "v2_value_bet",
      race_card_json: pick.race_card_json || pick.race?.runners || pick.runners || null,
      source: "dashboard",
    })
    .eq("id", existingPick.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({
      ok: false,
      error: updateError.message,
    });
  }

  return NextResponse.json({
    ok: true,
    updated: true,
    reason: "Existing pick updated with official logic version",
    pick: updatedPick,
  });
}

    const { data, error } = await supabase
      .from("saved_picks")
      .insert({
        race_date: pick.race_date,
        course: pick.course,
        race_number: pick.race_number,
        race_time: pick.race_time,
        horse_number: pick.horse_number,
        horse_name: pick.horse_name,
        confidence: pick.confidence,
        ai_score: pick.ai_score,
        reasoning: pick.reasoning,
        distance: pick.distance,
        condition: pick.condition,
        runner_count: pick.runner_count,
        state: pick.state,
                result: "pending",
        placed: null,
        dividend: null,
        place_dividend: null,
        bet_size: 100,
        return_amount: null,
        profit_loss: null,
        running_bank: null,
        settlement_status: "pending",
        bank_start: 1000,
        bet_percentage: 10,
        race_card_json: pick.race_card_json || pick.race?.runners || pick.runners || null,
logic_version: pick.logic_version || "v2_value_bet",
source: "dashboard",
      })
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
