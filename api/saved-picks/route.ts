import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("placedash_picks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Supabase fetch error:", error);

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
    console.error("Saved picks API error:", err);

    return NextResponse.json({
      ok: false,
      error: err.message || "Unknown error",
    });
  }
}
