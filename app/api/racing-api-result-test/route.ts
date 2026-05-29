import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getMelbourneDate() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Australia/Melbourne",
  });
}

export async function GET() {
  try {
    const username = process.env.RACING_API_USERNAME;
    const password = process.env.RACING_API_PASSWORD;

    if (!username || !password) {
      return NextResponse.json({
        ok: false,
        error: "Missing Racing API username or password",
      });
    }

    const auth = Buffer.from(`${username}:${password}`).toString("base64");

    const meetsRes = await fetch("https://api.theracingapi.com/v1/australia/meets", {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const meetsData = await meetsRes.json();
    const today = getMelbourneDate();

    const pakenhamMeet = (meetsData?.meets || []).find((meet: any) => {
      return (
        String(meet.course || "").toLowerCase() === "pakenham" &&
        meet.date === today
      );
    });

    if (!pakenhamMeet) {
      return NextResponse.json({
        ok: false,
        error: "Pakenham meet not found for today",
        today,
        meets: meetsData?.meets || [],
      });
    }

    const racesRes = await fetch(
      `https://api.theracingapi.com/v1/australia/meets/${pakenhamMeet.meet_id}/races`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const racesData = await racesRes.json();

    const race7 = (racesData?.races || []).find((race: any) => {
      return Number(race.race_number) === 7;
    });

    if (!race7) {
      return NextResponse.json({
        ok: false,
        error: "Pakenham Race 7 not found",
        meet: pakenhamMeet,
        races: racesData?.races || [],
      });
    }

    const runners = (race7.runners || []).map((runner: any) => {
      const sportsbet = runner.odds?.find(
        (odd: any) => String(odd.bookmaker || "").toLowerCase() === "sportsbet"
      );

      const ladbrokes = runner.odds?.find(
        (odd: any) => String(odd.bookmaker || "").toLowerCase() === "ladbrokes"
      );

      return {
        number: runner.number,
        horse: runner.horse,
        position: runner.position,
        scratched: runner.scratched,
        sportsbet_place: sportsbet?.place_odds || null,
        ladbrokes_place: ladbrokes?.place_odds || null,
        sportsbet_win: sportsbet?.win_odds || null,
        ladbrokes_win: ladbrokes?.win_odds || null,
      };
    });

    return NextResponse.json({
      ok: true,
      today,
      course: race7.course,
      race_number: race7.race_number,
      race_status: race7.race_status,
      off_time: race7.off_time,
      runners,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: String(error),
    });
  }
}
