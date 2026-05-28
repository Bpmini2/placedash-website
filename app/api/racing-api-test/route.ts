import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const username = process.env.RACING_API_USERNAME;
    const password = process.env.RACING_API_PASSWORD;

    if (!username || !password) {
      return NextResponse.json({
        ok: false,
        error: "Missing RACING_API_USERNAME or RACING_API_PASSWORD",
      });
    }

    const auth = Buffer.from(`${username}:${password}`).toString("base64");

    const res = await fetch("https://api.theracingapi.com/v1/australia/meets", {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      sample: data,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: String(error),
    });
  }
}
