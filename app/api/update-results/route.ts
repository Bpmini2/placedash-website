import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getMelbourneDate() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Australia/Melbourne",
  });
}

function normaliseText(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getRunnerPosition(runner: any) {
  const possibleValues = [
    runner.position,
    runner.finishingPosition,
    runner.finishing_position,
    runner.result,
    runner.finishPosition,
    runner.finish_position,
    runner.place,
    runner.placing,
  ];

  for (const value of possibleValues) {
    if (value === null || value === undefined) continue;

    const numberOnly = String(value).replace(/[^0-9]/g, "");
    const parsed = Number(numberOnly);

    if (parsed > 0) return parsed;
  }

  return null;
}

async function findRaceSlug(date: string, course: string, raceNumber: number) {
  const apiKey = process.env.FORMFAV_API_KEY;

  if (!apiKey) return null;

  const meetingsRes = await fetch(
    `https://api.formfav.com/v1/form/meetings?date=${date}`,
    {
      headers: {
        "X-API-Key": apiKey,
      },
      cache: "no-store",
    }
  );

  const meetingsData = await meetingsRes.json();
  const meetings = meetingsData?.meetings || meetingsData?.data?.meetings || [];

  const matchingMeeting = meetings.find((meeting: any) => {
    return normaliseText(meeting.track) === normaliseText(course);
  });

  if (!matchingMeeting?.slug) return null;

  const hasRace = (matchingMeeting.races || []).some((race: any) => {
    return Number(race.raceNumber) === Number(raceNumber);
  });

  if (!hasRace) return null;

  return matchingMeeting.slug;
}

async function fetchRaceResult(date: string, course: string, raceNumber: number) {
  const apiKey = process.env.FORMFAV_API_KEY;

  if (!apiKey) {
    throw new Error("FORMFAV_API_KEY is missing");
  }

  const slug = await findRaceSlug(date, course, raceNumber);

  if (!slug) {
    return null;
  }

  const raceRes = await fetch(
    `https://api.formfav.com/v1/form?date=${date}&track=${encodeURIComponent(
      slug
    )}&race=${raceNumber}`,
    {
      headers: {
        "X-API-Key": apiKey,
      },
      cache: "no-store",
    }
  );

  const raceData = await raceRes.json();
  const card = raceData?.data || raceData;

  return card;
}

export async function GET() {
  try {
    const today = getMelbourneDate();

    const { data: pendingPicks, error: pendingError } = await supabase
      .from("saved_picks")
      .select("*")
      .eq("result", "pending")
      .lte("race_date", today)
      .limit(50);

    if (pendingError) {
      return NextResponse.json({
        ok: false,
        error: pendingError.message,
      });
    }

    const updated: any[] = [];
    const notReady: any[] = [];
    const failed: any[] = [];

    for (const pick of pendingPicks || []) {
      try {
        const raceCard = await fetchRaceResult(
          pick.race_date,
          pick.course,
          pick.race_number
        );

        if (!raceCard?.runners || !Array.isArray(raceCard.runners)) {
          notReady.push({
            id: pick.id,
            course: pick.course,
            race_number: pick.race_number,
            reason: "Race result not available yet",
          });
          continue;
        }

        const matchedRunner = raceCard.runners.find((runner: any) => {
          return (
            normaliseText(runner.name) === normaliseText(pick.horse_name) ||
            Number(runner.number) === Number(pick.horse_number)
          );
        });

        if (!matchedRunner) {
          failed.push({
            id: pick.id,
            horse_name: pick.horse_name,
            reason: "Horse not found in returned race data",
          });
          continue;
        }

        const position = getRunnerPosition(matchedRunner);

        if (!position) {
          notReady.push({
            id: pick.id,
            course: pick.course,
            race_number: pick.race_number,
            horse_name: pick.horse_name,
            reason: "No finishing position available yet",
          });
          continue;
        }

        const placed = position <= 3;
        const betSize = Number(pick.bet_size || 100);
        const placeOdds = pick.place_odds ? Number(pick.place_odds) : null;

        let profitLoss = null;

        if (placed && placeOdds) {
          profitLoss = betSize * placeOdds - betSize;
        } else if (!placed) {
          profitLoss = -betSize;
        }

        const { error: updateError } = await supabase
          .from("saved_picks")
          .update({
            result: String(position),
            placed,
            bet_size: betSize,
            profit_loss: profitLoss,
          })
          .eq("id", pick.id);

        if (updateError) {
          failed.push({
            id: pick.id,
            reason: updateError.message,
          });
          continue;
        }

        updated.push({
          id: pick.id,
          course: pick.course,
          race_number: pick.race_number,
          horse_name: pick.horse_name,
          result: position,
          placed,
          profit_loss: profitLoss,
        });
      } catch (error) {
        failed.push({
          id: pick.id,
          reason: String(error),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      checked: pendingPicks?.length || 0,
      updated,
      notReady,
      failed,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: "Failed to update race results",
      details: String(error),
    });
  }
}
