import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getMelbourneDateOffset(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  return date.toLocaleDateString("en-CA", {
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

const today = getMelbourneDateOffset(0);
const yesterday = getMelbourneDateOffset(-1);
const tomorrow = getMelbourneDateOffset(1);

const targetDates = [today, yesterday, tomorrow];

const todaysMeets = (meetsData?.meets || []).filter((meet: any) =>
  targetDates.includes(meet.date)
);

    const allRaceOdds: any[] = [];

    for (const meet of todaysMeets) {
      const racesRes = await fetch(
        `https://api.theracingapi.com/v1/australia/meets/${meet.meet_id}/races`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      const racesData = await racesRes.json();

      for (const race of racesData?.races || []) {
        allRaceOdds.push({
          course: race.course,
          race_number: race.race_number,
          race_name: race.race_name,
          race_status: race.race_status,
          off_time: race.off_time,
          runners: (race.runners || []).map((runner: any) => {
            const sportsbet = runner.odds?.find(
              (o: any) => o.bookmaker === "Sportsbet"
            );

            const ladbrokes = runner.odds?.find(
              (o: any) => o.bookmaker === "Ladbrokes"
            );

            return {
              number: runner.number,
              horse: runner.horse,
              scratched: runner.scratched,
              sportsbet_win: sportsbet?.win_odds || null,
              sportsbet_place: sportsbet?.place_odds || null,
              ladbrokes_win: ladbrokes?.win_odds || null,
              ladbrokes_place: ladbrokes?.place_odds || null,
            };
          }),
        });
      }
    }

    return NextResponse.json({
  ok: true,
  date: today,
  targetDates,
  availableDates: Array.from(
    new Set((meetsData?.meets || []).map((meet: any) => meet.date))
  ),
  meetCount: todaysMeets.length,
  raceCount: allRaceOdds.length,
  oddsView: allRaceOdds,
});
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: String(error),
    });
  }
}
