import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.PUNTINGFORM_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error: "PUNTINGFORM_API_KEY is missing",
    });
  }

  const res = await fetch(
    `https://api.puntingform.com.au/v2/form/meetingslist?meetingDate=2026-05-17&apiKey=${apiKey}`,
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
    response: text.slice(0, 5000),
  });
}
