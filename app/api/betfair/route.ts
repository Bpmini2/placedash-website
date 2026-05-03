import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.betfair.com/exchange/betting/json-rpc/v1", {
      method: "POST",
      headers: {
        "X-Application": process.env.BETFAIR_APP_KEY!,
        "X-Authentication": process.env.BETFAIR_SESSION!,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "SportsAPING/v1.0/listMarketCatalogue",
        params: {
          filter: {
            eventTypeIds: ["7"], // Horse Racing
            marketCountries: ["AU"] // Australia only
          },
          marketProjection: ["RUNNER_DESCRIPTION"],
          maxResults: "20"
        },
        id: 1
      })
    });

    const data = await res.json();

    return NextResponse.json(data.result || []);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch Betfair data" });
  }
}
