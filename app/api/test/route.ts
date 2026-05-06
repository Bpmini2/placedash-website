import { NextResponse } from "next/server";

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const res = await fetch(
  `https://api.formfav.com/v1/form?date=${today}&track=ascot&race=1`,
  {
        headers: {
          "X-API-Key": process.env.FORMFAV_API_KEY || "",
        },
        cache: "no-store",
      }
    );

    const data = await res.json();

    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      date: today,
      data,
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to fetch FormFav meetings",
      details: String(error),
    });
  }
}
