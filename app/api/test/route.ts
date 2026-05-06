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

    const links = Array.from(html.matchAll(/href="([^"]*\/form\/[^"]*)"/g))
      .map((match) => match[1])
      .slice(0, 30);

    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      foundRaceLinks: links.length > 0,
      linkCount: links.length,
      links,
      preview: html.slice(0, 500),
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to fetch LadbrokesForm",
      details: String(error),
    });
  }
}
