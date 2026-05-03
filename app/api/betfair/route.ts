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
  eventTypeIds: ["7"],
  marketCountries: ["AU"],
  marketTypeCodes: ["WIN"],
},
          marketProjection: ["EVENT", "MARKET_START_TIME", "RUNNER_DESCRIPTION"],
          maxResults: "100"
        },
        id: 1
      })
    });

    const data = await res.json();

    const races = (data.result || []).map((market: any) => ({
      course: market.event?.name || "Australian Race",
      race_number: "",
      off_time: market.marketStartTime
        ? new Date(market.marketStartTime).toLocaleTimeString("en-AU", {
            hour: "2-digit",
            minute: "2-digit"
          })
        : "TBA",
      runners: (market.runners || []).map((runner: any) => ({
        horse: runner.runnerName,
        draw: "5",
        lbs: "56",
        form: "123"
      }))
    }));

    return NextResponse.json({
  raw: data,
  races
});
  } catch (error) {
    console.error(error);
    return NextResponse.json({
  error: "Failed to fetch Betfair data",
  details: String(error)
});
  }
}
