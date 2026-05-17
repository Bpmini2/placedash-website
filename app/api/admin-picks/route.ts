import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("saved_picks")
    .select("*")
    .order("race_date", { ascending: false })
    .order("race_time", { ascending: true });

  if (error) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      picks: [],
    });
  }

  return NextResponse.json({
    ok: true,
    picks: data || [],
  });
}
