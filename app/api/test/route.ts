import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://ladbrokesform.com.au/", {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
    });

    const html = await res.text();

    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      foundAusNz: html.includes("Horse Racing - Australia & New Zealand"),
      foundRaceLinks: html.includes("/form/"),
      preview: html.slice(0, 500),
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to fetch LadbrokesForm",
      details: String(error),
    });
  }
}
