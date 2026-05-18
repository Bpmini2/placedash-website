import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.PUNTINGFORM_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error: "PUNTINGFORM_API_KEY is missing",
    });
  }

  const meetingId = 239588; // Devonport Synthetic, 17 May 2026
  const raceNumber = 5; // Roundle Park race

  const res = await fetch(
    `https://api.puntingform.com.au/v2/form/results?meetingId=${meetingId}&raceNumber=${raceNumber}&apiKey=${apiKey}`,
    {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const text = await res.text();

  return NextResponse.json({
    ok: res.ok,
    status: res.status,
    meetingId,
    raceNumber,
    response: text.slice(0, 8000),
  });
}
