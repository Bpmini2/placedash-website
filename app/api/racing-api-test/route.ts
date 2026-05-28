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

    return NextResponse.json({
      ok: true,
      message: "Racing API environment variables are loaded.",
      usernameFound: true,
      passwordFound: true,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: String(error),
    });
  }
}
