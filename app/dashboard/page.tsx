"use client";

import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [races, setRaces] = useState<any[]>([]);
  const [liveOdds, setLiveOdds] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedRace, setSelectedRace] = useState<any | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
const [isAdminPreviewAllowed, setIsAdminPreviewAllowed] = useState(false);
  const [isAdminDashboard, setIsAdminDashboard] = useState(false);
  const [debugRaces, setDebugRaces] = useState<any[]>([]);
  const [isDebugTodayMode, setIsDebugTodayMode] = useState(false);
function canShowTomorrowPreview() {
  const now = new Date();

  const melbourneTime = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Australia/Melbourne",
    })
  );

  const hour = melbourneTime.getHours();

  return hour >= 21 && hour < 24;
}
  function countStarts(runner: any) {
  if (typeof runner.starts === "number") return runner.starts;

  if (runner.stats?.career?.total) {
    return Number(runner.stats.career.total);
  }

  if (runner.raw?.stats?.career?.total) {
    return Number(runner.raw.stats.career.total);
  }

  if (runner.stats?.career_starts) {
    return Number(runner.stats.career_starts);
  }

  if (runner.raw?.stats?.career_starts) {
    return Number(runner.raw.stats.career_starts);
  }

  if (runner.form) {
    return runner.form.replace(/[^0-9]/g, "").length;
  }

  return 0;
}

  function evaluateRecentForm(form: string, last20Starts?: string) {
    const formText = last20Starts || form;
    if (!formText) return 30;

    const results = formText
      .replace(/[^0-9]/g, "")
      .split("")
      .map(Number)
      .filter((n) => n > 0);

    if (results.length === 0) return 30;

    const recentResults = results.slice(0, 5);

    const score = recentResults.reduce((total, result, index) => {
      const recencyWeight = index === 0 ? 1.25 : index === 1 ? 1.1 : 1;

      if (result === 1) return total + 90 * recencyWeight;
      if (result === 2) return total + 72 * recencyWeight;
      if (result === 3) return total + 58 * recencyWeight;
      if (result <= 5) return total + 32 * recencyWeight;
      if (result <= 7) return total + 10 * recencyWeight;

      return total - 12 * recencyWeight;
    }, 0);

    return Math.round(score / recentResults.length);
  }

  function statPlacePercent(stats: any) {
    if (!stats) return null;

    if (typeof stats.placePercent === "number") {
      return stats.placePercent * 100;
    }

    if (stats.starts && stats.places) {
      return (stats.places / stats.starts) * 100;
    }

    return null;
  }

  function evaluateSpecialistStats(runner: any) {
    let bonus = 0;
    const notes: string[] = [];

    const trackPlace = statPlacePercent(runner.trackStats);
    const distancePlace = statPlacePercent(runner.distanceStats);
    const trackDistancePlace = statPlacePercent(runner.trackDistanceStats);
    const conditionPlace = statPlacePercent(runner.conditionStats);

    if (trackPlace !== null && trackPlace >= 50) {
      bonus += 5;
      notes.push("Track record support");
    }

    if (distancePlace !== null && distancePlace >= 50) {
      bonus += 6;
      notes.push("Distance suitability");
    }

    if (trackDistancePlace !== null && trackDistancePlace >= 45) {
      bonus += 7;
      notes.push("Track/distance profile support");
    }

    if (conditionPlace !== null && conditionPlace >= 50) {
      bonus += 5;
      notes.push("Condition suitability");
    }

    return { bonus, notes };
  }

  function evaluateWeight(runner: any) {
    const weight = Number(runner.lbs || runner.weight || 0);
    const claim = Number(runner.claim || 0);

    if (!weight) return { bonus: 0, note: "" };

    const adjustedWeight = claim ? weight - claim : weight;

    if (adjustedWeight <= 54) {
      return { bonus: 4, note: "Light weight profile" };
    }

    if (adjustedWeight <= 56) {
      return { bonus: 2, note: "Manageable weight" };
    }

    if (adjustedWeight >= 60) {
      return { bonus: -3, note: "Higher weight carried" };
    }

    return { bonus: 0, note: "" };
  }

  function getRunnerReasoning(runner: any) {
    const reasons: string[] = [];
    const starts = Number(runner.starts || 0);
    const placePercent = Number(runner.displayPlacePercent || 0);
    const score = Number(runner.score || 0);
    const betStatus = String(runner.decision || runner.betStatus || "");
    const horsePlacePercent = Number(
      runner.placePercentage || runner.placePercent || runner.place_rate || 0
    );

    const lastRun = Number(
      String(runner.form || "")
        .replace(/[^0-9]/g, "")
        .slice(0, 1)
    );

    const recentPlacePercent = Number(
      runner.recentPlaceStats?.recentPlacePercent || 0
    );

    if (placePercent >= 55) reasons.push("Strong overall place record");
    else if (placePercent >= 40) reasons.push("Solid overall place record");
    else if (recentPlacePercent >= 80) {
      reasons.push("Strong recent place support");
    } else if (recentPlacePercent >= 50) {
      reasons.push("Recent placing support");
    }

    const hasRecentPlace = String(runner.form || "")
      .replace(/[^0-9]/g, "")
      .slice(0, 4)
      .split("")
      .some((n) => ["1", "2", "3"].includes(n));

    if (runner.recentFormScore >= 65 && hasRecentPlace) {
      reasons.push("Strong recent form");
    } else if (runner.recentFormScore >= 45 && hasRecentPlace) {
      reasons.push("Recent form support");
    } else if (!hasRecentPlace) {
      reasons.push("No recent placing support");
    } else {
      reasons.push("Recent form concern");
    }

    if (starts >= 10) reasons.push("Experienced runner");
    else if (starts >= 3) reasons.push("Meets minimum race experience");
    else if (starts > 0) reasons.push("Limited race experience");

    if (runner.draw && Number(runner.draw) > 0 && Number(runner.draw) <= 6) {
      reasons.push("Favourable barrier");
    }

    if (runner.weightNote) reasons.push(runner.weightNote);

    if (runner.specialistNotes?.length) {
      reasons.push(...runner.specialistNotes);
    }

    if (runner.jockey && runner.trainer) {
      reasons.push("Jockey and trainer data available");
    }

    if (score >= 70) reasons.push("High PlaceDash score");
    else if (score >= 50) reasons.push("Medium PlaceDash score");

    if (placePercent > 0 && placePercent < 40) {
      reasons.push("Low overall place strike rate");
    }

    if (lastRun >= 8) {
      reasons.push("Last start concern");
    }

    if (betStatus === "BET") {
      reasons.unshift("Bet-qualified profile");
    } else if (betStatus === "WATCH") {
      reasons.unshift("Watch only - not strong enough for official bet");
    } else if (betStatus === "LOW VALUE") {
      reasons.unshift("Low value at current place odds");
    } else if (betStatus === "AVOID") {
      reasons.unshift("Avoid profile");
    }

    if (reasons.length === 0) reasons.push("Limited data available");

    return Array.from(new Set(reasons)).slice(0, 5);
  }


  function getRecentFormPlaceStats(runner: any) {
    const formText = String(
      runner.form ||
        runner.last20Starts ||
        runner.last_20_starts ||
        ""
    );

    const results = formText
      .replace(/[^0-9]/g, "")
      .split("")
      .map(Number)
      .filter((n) => n > 0);

    const recentResults = results.slice(0, 5);

    const recentPlaces = recentResults.filter((n) =>
      [1, 2, 3].includes(n)
    ).length;

    const recentPlacePercent =
      recentResults.length > 0
        ? (recentPlaces / recentResults.length) * 100
        : 0;

    return {
      recentStarts: recentResults.length,
      recentPlaces,
      recentPlacePercent,
      hasRecentPlaceSupport: recentPlaces > 0,
    };
  }

  function scoreRunner(runner: any) {
    const starts = countStarts(runner);
    const wins = Number(runner.wins || 0);
    const places = Number(runner.places || 0);

    const recentPlaceStats = getRecentFormPlaceStats(runner);

    const apiPlacePercent =
      typeof runner.placePercent === "number"
        ? runner.placePercent * 100
        : starts > 0
        ? (places / starts) * 100
        : 0;

    const apiPlaceReliable =
      starts >= 3 &&
      apiPlacePercent > 0 &&
      places > 0;

    const formPlaceFallbackPercent =
      recentPlaceStats.recentStarts > 0
        ? recentPlaceStats.recentPlacePercent
        : 0;

    const horsePlacePercent = apiPlaceReliable
      ? apiPlacePercent
      : Math.max(apiPlacePercent, formPlaceFallbackPercent);

    const horseWinPercent =
      typeof runner.winPercent === "number"
        ? runner.winPercent * 100
        : starts > 0
        ? (wins / starts) * 100
        : 0;

    const recentForm = evaluateRecentForm(runner.form, runner.last20Starts);
    const specialist = evaluateSpecialistStats(runner);
    const weight = evaluateWeight(runner);

    let score = 0;

    score += horsePlacePercent * 0.38;
    score += horseWinPercent * 0.12;
    score += recentForm * 0.28;
    score += specialist.bonus;
    score += weight.bonus;

    if (runner.jockey) score += 4;
    if (runner.trainer) score += 4;

    if (runner.draw) {
      score += Math.max(0, 10 - parseInt(String(runner.draw))) * 0.45;
    }

    if (runner.scratched) {
      score = 0;
    }

    score = Math.min(100, Math.max(0, score));

    let confidence = "LOW";
    if (score >= 70) confidence = "HIGH";
    else if (score >= 55) confidence = "MEDIUM";

    let betStatus = "AVOID";

    const hasRecentPlace = String(runner.form || "")
      .replace(/[^0-9]/g, "")
      .slice(0, 4)
      .split("")
      .some((n) => ["1", "2", "3"].includes(n));

    const hasRecentBadRun = String(runner.form || "")
      .replace(/[^0-9]/g, "")
      .slice(0, 3)
      .split("")
      .some((n) => Number(n) >= 8);

    const lastRun = Number(
      String(runner.form || "")
        .replace(/[^0-9]/g, "")
        .slice(0, 1)
    );

    const lowPlaceRecord = horsePlacePercent < 40;

    if (lastRun >= 8 || runner.scratched) {
      betStatus = "AVOID";
    } else if (
      score >= 62 &&
      horsePlacePercent >= 40 &&
      hasRecentPlace &&
      !hasRecentBadRun
    ) {
      betStatus = "BET";
    } else if (score >= 55 && !lowPlaceRecord && hasRecentPlace) {
      betStatus = "WATCH";
    }

    // AI LOGIC:
    // Horses with fewer than 3 starts can still appear in the full race table,
    // but they must never be HIGH confidence or official BET selections.
    // Best possible label for under-3-start runners is MEDIUM · WATCH.
    if (starts < 3) {
      score = Math.min(score, 69);

      if (confidence === "HIGH") {
        confidence = "MEDIUM";
      }

      if (betStatus === "BET") {
        betStatus = "WATCH";
      }
    }

    const scoredRunner = {
      ...runner,
      score: Math.round(score),
      confidence,
      betStatus,
      starts,
      recentFormScore: recentForm,
      recentPlaceStats,
      displayPlacePercent: Math.round(horsePlacePercent),
      specialistNotes: specialist.notes,
      weightNote: weight.note,
    };

    return {
      ...scoredRunner,
      reasoning: getRunnerReasoning(scoredRunner),
    };
  }
function getDecisionColor(decision: string) {
  if (decision === "BET") return "#22c55e";
  if (decision === "WATCH") return "#38bdf8";
  if (decision === "LOW VALUE") return "#facc15";
  if (decision === "AVOID") return "#ef4444";
  return "#94a3b8";
}

function getDecisionBackground(decision: string) {
  if (decision === "BET") return "rgba(34,197,94,0.15)";
  if (decision === "WATCH") return "rgba(56,189,248,0.15)";
  if (decision === "LOW VALUE") return "rgba(250,204,21,0.15)";
  if (decision === "AVOID") return "rgba(239,68,68,0.15)";
  return "rgba(148,163,184,0.15)";
}

function getDecisionMeaning(decision: string) {
  if (decision === "BET") return "Official PlaceDash selection";
  if (decision === "WATCH") return "Possible contender — punter decides";
  if (decision === "LOW VALUE") return "Good profile maybe, but price too short";
  if (decision === "AVOID") return "AI does not like the profile";
  return "Review runner";
}
  function getRunnerBestPlaceOdds(runner: any) {
    const possiblePlaceOdds = [
      runner?.sportsbetPlaceOdds,
      runner?.sportsbet_place_odds,
      runner?.sportsbet_place,
      runner?.sbPlaceOdds,
      runner?.sb_place_odds,
      runner?.ladbrokesPlaceOdds,
      runner?.ladbrokes_place_odds,
      runner?.ladbrokes_place,
      runner?.lbPlaceOdds,
      runner?.lb_place_odds,
      runner?.placeOdds,
      runner?.place_odds,
      runner?.place_price,
      runner?.placePrice,
    ];

    const validOdds = possiblePlaceOdds
      .map((odd: any) => Number(odd))
      .filter((odd: number) => !Number.isNaN(odd) && odd > 1);

    if (validOdds.length === 0) return null;

    return Math.max(...validOdds);
  }

  function getValueDecision(scoredRunner: any) {
    const placeOdds = getRunnerBestPlaceOdds(scoredRunner);
    const runnerStarts = countStarts(scoredRunner);

    // AI LOGIC SAFETY RULE:
    // Under-3-start runners can be displayed, but cannot become official BET selections.
    if (runnerStarts < 3) {
      return {
        decision: "WATCH",
        placeOdds,
        valueScore: Math.min(scoredRunner.score || 0, 69),
        valueReason: "Watch only - fewer than 3 career starts",
      };
    }

    if (!placeOdds) {
      return {
        decision: "WATCH",
        placeOdds: null,
        valueScore: scoredRunner.score - 5,
        valueReason: "No live place odds available yet",
      };
    }

    if (placeOdds < 1.3) {
      return {
        decision: "LOW VALUE",
        placeOdds,
        valueScore: scoredRunner.score - 25,
        valueReason: "Place odds are too short for value",
      };
    }

    if (scoredRunner.confidence === "LOW") {
      return {
        decision: "AVOID",
        placeOdds,
        valueScore: scoredRunner.score - 30,
        valueReason: "Low AI confidence",
      };
    }

    if (scoredRunner.confidence === "HIGH" && placeOdds >= 1.3) {
      return {
        decision: "BET",
        placeOdds,
        valueScore: scoredRunner.score + 10,
        valueReason: "Strong AI rating with acceptable place odds",
      };
    }

    return {
      decision: "WATCH",
      placeOdds,
      valueScore: scoredRunner.score,
      valueReason: "Acceptable runner but not a clear value bet",
    };
  }

  function applyValueDecision(runner: any) {
    const scoredRunner = scoreRunner(runner);

    // Keep original runner odds attached so value logic can see live SB/LB place prices.
    const runnerWithOdds = {
      ...runner,
      ...scoredRunner,
    };

    const valueDecision = getValueDecision(runnerWithOdds);

    const valuedRunner = {
      ...runnerWithOdds,
      decision: valueDecision.decision,
      betStatus: valueDecision.decision,
      placeOdds: valueDecision.placeOdds,
      valueScore: valueDecision.valueScore,
      valueReason: valueDecision.valueReason,
    };

    return {
      ...valuedRunner,
      reasoning: Array.from(
        new Set([
          valueDecision.valueReason,
          ...getRunnerReasoning(valuedRunner),
        ])
      )
        .filter(Boolean)
        .slice(0, 5),
    };
  }

  function getBestRunner(race: any) {
    if (!race.runners || race.runners.length === 0) return null;

    const scoredRunners = race.runners
      .filter((runner: any) => countStarts(runner) >= 3)
      .filter((runner: any) => !runner.scratched)
      .map((runner: any) => applyValueDecision(runner))
      .sort((a: any, b: any) => b.valueScore - a.valueScore);

    const betRunner = scoredRunners.find(
      (runner: any) => runner.decision === "BET"
    );
    const watchRunner = scoredRunners.find(
      (runner: any) => runner.decision === "WATCH"
    );

    return betRunner || watchRunner || scoredRunners[0] || null;
  }

  function getScoredRunners(race: any) {
    if (!race?.runners || race.runners.length === 0) return [];

    // Full race table must show every runner.
    // AI Logic still prevents under-3-start runners from becoming official BET selections.
    return race.runners
      .map((runner: any) => applyValueDecision(runner))
      .sort((a: any, b: any) => b.valueScore - a.valueScore);
  }

  useEffect(() => {
  async function loadRaces() {
    try {
      const previewAllowed = canShowTomorrowPreview();
      setIsAdminPreviewAllowed(previewAllowed);

      const searchParams = new URLSearchParams(window.location.search);

      const adminMode = searchParams.get("admin") === "true";
const forcePreview = searchParams.get("forcePreview") === "true";
const debugToday = searchParams.get("debugToday") === "true";

      setIsAdminDashboard(adminMode);
      setIsDebugTodayMode(adminMode && debugToday);

      const usePreview = adminMode && (previewAllowed || forcePreview);

      setIsPreviewMode(usePreview);

      const raceApiEndpoint = usePreview
  ? "/api/placedash-races/preview"
  : "/api/placedash-races/today";

const res = await fetch(raceApiEndpoint);
      const data = await res.json();

      const rawRaces = data.races || [];
      const apiRaceDate = data.date || "";

      const racesWithOdds = rawRaces.map((race: any) => ({
        ...race,
        race_date: apiRaceDate,
        race_number: race.raceNumber || race.race_number,
        race_name: race.raceName || race.race_name,
        race_status: race.raceStatus || race.race_status,
        off_time: race.startTime || race.off_time,
        runners: (race.runners || []).map((runner: any) => ({
          ...runner,
          runner_number: runner.number || runner.runner_number,
          horse: runner.horse || runner.name,
          draw: runner.barrier || runner.draw,
          sportsbet_place: runner.odds?.sportsbetPlace || null,
          sportsbet_win: runner.odds?.sportsbetWin || null,
          ladbrokes_place: runner.odds?.ladbrokesPlace || null,
          ladbrokes_win: runner.odds?.ladbrokesWin || null,
        })),
      }));

      const officialBetRaces = racesWithOdds.filter((race: any) => {
        const topPick = getBestRunner(race);
        return topPick?.decision === "BET";
      });

      setDebugRaces(racesWithOdds);

      if (usePreview || (adminMode && debugToday)) {
  setRaces(racesWithOdds);
} else {
  setRaces(officialBetRaces);
}

      if (!usePreview && !debugToday && officialBetRaces.length) {
        for (const race of officialBetRaces) {
          const topPick = getBestRunner(race);

          if (!topPick) continue;
          if (topPick.decision !== "BET") continue;

          try {
            await fetch("/api/saved-picks", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                race_date:
  race.race_date ||
  new Date().toLocaleDateString("en-CA", {
    timeZone: "Australia/Melbourne",
  }),
                course: race.course,
                race_number: race.race_number || race.raceNumber,
                race_time: race.off_time || race.raceTime,
                horse_number: topPick.number,
                horse_name: topPick.horse || topPick.name,
                confidence: topPick.confidence,
                ai_score: topPick.score,
                reasoning: Array.isArray(topPick.reasoning)
                  ? topPick.reasoning.join(", ")
                  : String(topPick.reasoning || ""),
                distance: race.distance,
                condition: race.condition,
                runner_count: race.runners?.length || 0,
                state: race.state,
                race_card_json: race.runners || [],
                logic_version: "v2_value_bet",
              }),
            });
          } catch (err) {
            console.error("Failed saving pick", err);
          }
        }
      }
    } catch (err) {
      console.error("Failed loading races", err);
    } finally {
      setLoading(false);
    }
  }

  loadRaces();
}, []);

 const displayRaces = races
  .filter((race: any) => {
    const runnerCount = race.runners?.length || 0;
    return runnerCount >= 8 && runnerCount <= 11;
  })
  .filter((race: any) => {
    if (isPreviewMode || isDebugTodayMode) return true;

    const best = getBestRunner(race);
    return best?.decision === "BET";
  });
const debugSkippedRaces = debugRaces.map((race: any) => {
  const best = getBestRunner(race);
  const runnerCount = race.runners?.length || 0;

  let reason = "Unknown reason";

  if (runnerCount < 8 || runnerCount > 11) {
    reason = `runner count ${runnerCount}`;
  } else if (!best) {
    reason = "no suitable runner found";
  } else if (best.decision === "WATCH") {
    reason = `best runner WATCH — ${best.reasoning?.[0] || "not strong enough for official bet"}`;
  } else if (best.decision === "LOW VALUE") {
    reason = `best runner LOW VALUE — ${best.reasoning?.[0] || "value filter failed"}`;
  } else if (best.decision === "AVOID") {
    reason = `best runner AVOID — ${best.reasoning?.[0] || "avoid profile"}`;
  } else if (best.decision !== "BET") {
    reason = `best runner ${best.decision || "not BET"}`;
  } else {
    reason = "BET-qualified but not displayed";
  }

  return {
    course: race.course,
    race_number: race.race_number || race.raceNumber,
    state: race.state,
    bestRunner: best,
    reason,
  };
});
  const selectedBestRunner = selectedRace ? getBestRunner(selectedRace) : null;
  const scoredRunners = selectedRace ? getScoredRunners(selectedRace) : [];

  return (
    <main
      style={{
        padding: "32px 48px",
        width: "100%",
        minHeight: "100vh",
        backgroundImage:
          'linear-gradient(rgba(2,8,18,0.86), rgba(2,8,18,0.91)), url("/racehorse-bg.png")',
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <header
          style={{
            width: "100%",
            marginBottom: "50px",
            background: "#f3f4f6",
            border: "1px solid rgba(255,255,255,0.95)",
            borderRadius: "26px",
            padding: "20px 34px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "18px",
                  background: "#38bdf8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#07111f",
                  fontSize: "30px",
                  fontWeight: 900,
                  fontStyle: "italic",
                  letterSpacing: "-3px",
                  boxShadow: "0 10px 25px rgba(32,200,101,0.35)",
                }}
              >
                123
              </div>

              <span
                style={{
                  fontSize: "44px",
                  fontWeight: 900,
                  color: "#07111f",
                  lineHeight: 1,
                }}
              >
                PlaceDash
              </span>
            </div>

            <nav style={{ display: "flex", gap: "46px" }}>
              <a
                href="/"
                style={{
                  color: "#07111f",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Home
              </a>
              <a
                href="/track-record"
                style={{
                  color: "#07111f",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Track Record
              </a>
              <a
  href="/bankroll-calculator"
  style={{
    color: "#07111f",
    fontWeight: 700,
    textDecoration: "none",
  }}
>
  Bankroll Planner
</a>
              <div
  style={{
    position: "relative",
    display: "inline-block",
  }}
  onMouseEnter={(e) => {
    const menu = e.currentTarget.querySelector(".admin-dropdown") as HTMLElement;
    if (menu) menu.style.display = "block";
  }}
  onMouseLeave={(e) => {
    const menu = e.currentTarget.querySelector(".admin-dropdown") as HTMLElement;
    if (menu) menu.style.display = "none";
  }}
>
  <span
    style={{
      color: "#0284c7",
      fontWeight: 800,
      textDecoration: "none",
      cursor: "pointer",
    }}
  >
    Admin ▾
  </span>

  <div
  className="admin-dropdown"
  style={{
    display: "none",
    position: "absolute",
    top: "18px",
    left: "-12px",
    minWidth: "240px",
    paddingTop: "18px",
    zIndex: 10000,
  }}
>
  <div
    style={{
      background: "#ffffff",
      border: "1px solid rgba(2,132,199,0.25)",
      borderRadius: "12px",
      boxShadow: "0 14px 40px rgba(0,0,0,0.18)",
      padding: "10px",
    }}
  >
    <a
      href="/track-record?admin=true"
      style={{
        display: "block",
        padding: "10px 12px",
        color: "#0284c7",
        fontWeight: 700,
        textDecoration: "none",
        borderRadius: "8px",
      }}
    >
      Admin Track Record
    </a>

    <a
      href="/dashboard?admin=true&debugToday=true"
      style={{
        display: "block",
        padding: "10px 12px",
        color: "#0284c7",
        fontWeight: 700,
        textDecoration: "none",
        borderRadius: "8px",
      }}
    >
      Admin Review Today
    </a>

    <a
      href="/dashboard?admin=true&forcePreview=true"
      style={{
        display: "block",
        padding: "10px 12px",
        color: "#0284c7",
        fontWeight: 700,
        textDecoration: "none",
        borderRadius: "8px",
      }}
       >
      Admin Preview Tomorrow
    </a>
    <a
  href="/track-record-favourite-split?admin=true"
  style={{
    display: "block",
    padding: "10px 12px",
    color: "#0284c7",
    fontWeight: 700,
    textDecoration: "none",
    borderRadius: "8px",
  }}
>
  Admin Favourite Split
</a>
  </div>
</div>
</div>
              <a
                href="/#pricing"
                style={{
                  color: "#07111f",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Pricing
              </a>
            </nav>

            <a
              href="/"
              style={{
                background: "#38bdf8",
                color: "#07111f",
                padding: "18px 34px",
                borderRadius: "16px",
                fontWeight: 800,
                fontSize: "17px",
                textDecoration: "none",
                boxShadow: "0 16px 35px rgba(32,200,101,0.35)",
                whiteSpace: "nowrap",
              }}
            >
              Back to Home
            </a>
          </div>
        </header>

        <div style={{ marginBottom: "26px" }}>
          <div
            style={{
              display: "inline-block",
              marginBottom: "14px",
              padding: "7px 14px",
              borderRadius: "999px",
              background: "rgba(56,189,248,0.14)",
              color: "#38bdf8",
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            PlaceDash Live Dashboard
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "58px",
              lineHeight: "1.02",
              letterSpacing: "-2px",
              color: "#ffffff",
            }}
          >
            {isDebugTodayMode
  ? "Admin Review Today"
  : isPreviewMode
  ? "Admin Preview Tomorrow"
  : "Today’s AI Dashboard"}
          </h1>
        </div>

        <p
          style={{
            color: "#b7c5d8",
            fontSize: "17px",
            marginTop: "-12px",
            marginBottom: "18px",
          }}
        >
          AI-powered place selections for Australian racing.
        </p>

        <div
          style={{
            display: "inline-block",
            marginTop: "10px",
            padding: "6px 10px",
            borderRadius: "999px",
            background: "rgba(56,189,248,0.12)",
            color: "#38bdf8",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          Last Updated: {new Date().toLocaleString("en-AU")}
        </div>

        <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "8px" }}>
          Race times are shown in the local track timezone.
        </p>
        <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
          SB = Sportsbet odds · LB = Ladbrokes odds. Odds are live bookmaker
          prices and may change before race start.
        </p>
        <p
          style={{
            color: "#94a3b8",
            fontSize: "12px",
            marginTop: "4px",
            lineHeight: 1.5,
          }}
        >
          Gamble responsibly. PlaceDash provides racing analysis and information
          only — it is not betting advice and does not guarantee results. If
          gambling is becoming a problem, contact Gambling Help Online on 1800
          858 858 or visit BetStop for self-exclusion support.
        </p>

        <div
          style={{
            marginTop: "28px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "28px",
          }}
        >
          {loading && (
            <div
              style={{
                padding: "20px",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                color: "#94a3b8",
              }}
            >
              Loading today’s race cards...
            </div>
          )}

          {!loading && displayRaces.length === 0 && (
            <div
              style={{
                padding: "26px",
                background: "rgba(15,23,42,0.58)",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: "22px",
                boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
                backdropFilter: "blur(14px)",
                color: "#b7c5d8",
              }}
            >
              <strong style={{ color: "#ffffff", fontSize: "18px" }}>
                No official BET races found right now.
              </strong>
              <p style={{ marginTop: "10px", lineHeight: 1.6 }}>
                PlaceDash is currently only showing races with a value-qualified
                BET selection.
              </p>
              <p style={{ marginTop: "10px", color: "#94a3b8", lineHeight: 1.6 }}>
                WATCH, LOW VALUE, and AVOID races are not saved as official
                Track Record selections.
              </p>
            </div>
          )}
          
{isPreviewMode && (
  <div
    style={{
      gridColumn: "1 / -1",
      marginBottom: "18px",
      padding: "14px 18px",
      borderRadius: "14px",
      border: "1px solid rgba(250,204,21,0.45)",
      background: "rgba(250,204,21,0.12)",
      color: "#facc15",
      fontWeight: 900,
      lineHeight: 1.5,
    }}
  >
    PREVIEW ONLY / ADMIN PREVIEW — Tomorrow&apos;s races are being shown for review only.
    These picks are not saved to Track Record and do not affect official stats, ROI, profit/loss, or bankroll.
  </div>
)}
          {isDebugTodayMode && (
  <div
    style={{
      gridColumn: "1 / -1",
      marginTop: "18px",
      marginBottom: "22px",
      padding: "14px 16px",
      borderRadius: "12px",
      border: "1px solid rgba(56,189,248,0.45)",
      background: "rgba(56,189,248,0.12)",
      color: "#38bdf8",
      fontWeight: 900,
      lineHeight: 1.5,
    }}
  >
    ADMIN REVIEW TODAY — Showing today&apos;s qualifying races before the final
    BET-only Dashboard filter. These review races are for admin diagnosis only
    and do not save WATCH, LOW VALUE, or AVOID runners to Track Record.
  </div>
)}
          {displayRaces.map((race: any, index: number) => {
            const bestRunner = getBestRunner(race);
            const visibleHorse = `${bestRunner?.number ? bestRunner.number + ". " : ""}${
              bestRunner?.horse || "No selection"
            }`;

            return (
              <div
                key={`${race.course}-${race.race_number}`}
                onClick={() => {
                  setSelectedRace(race);
                }}
                style={{
                  padding: "26px",
                  border: "1px solid rgba(255,255,255,0.16)",
                  borderRadius: "24px",
                  cursor: "pointer",
                  background: "rgba(15,23,42,0.58)",
                  backdropFilter: "blur(14px)",
                  boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
                }}
              >
                <h3>
                  {race.course} Race {race.race_number || ""}
                  {race.state ? ` (${race.state})` : ""}
                </h3>

                {(() => {
  const raceDateText = race.race_date
    ? new Date(`${race.race_date}T12:00:00`).toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Not available";

  const melbourneTimeText = race.off_time
    ? new Date(race.off_time).toLocaleTimeString("en-AU", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Australia/Melbourne",
      })
    : "Not available";

  const localTrackTimeZone =
    race.state === "WA"
      ? "Australia/Perth"
      : race.state === "SA" || race.state === "NT"
      ? "Australia/Adelaide"
      : race.state === "QLD"
      ? "Australia/Brisbane"
      : race.state === "TAS"
      ? "Australia/Hobart"
      : race.state === "NSW" || race.state === "ACT"
      ? "Australia/Sydney"
      : "Australia/Melbourne";

  const localTrackTimeText = race.off_time
    ? new Date(race.off_time).toLocaleTimeString("en-AU", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: localTrackTimeZone,
      })
    : "Not available";

  return (
    <div
      style={{
        color: "#94a3b8",
        fontSize: "14px",
        lineHeight: "1.5",
        marginTop: "12px",
        marginBottom: "12px",
      }}
    >
      <div>Date: {raceDateText}</div>
      <div>Melbourne Time: {melbourneTimeText}</div>
      <div>
        Local Track Time: {localTrackTimeText}
        {race.timezone_label ? ` ${race.timezone_label}` : ""}
      </div>
      <div>Runners: {race.runners?.length || 0}</div>
    </div>
  );
})()}

                <p style={{ marginTop: "10px" }}>
                  Selection: <strong>{visibleHorse}</strong>
                </p>

                {bestRunner && (() => {
                  const raceNumber = race.race_number || race.raceNumber;
                  const runnerNumber = bestRunner.number;

                  const directOdds =
                    liveOdds[`${race.course}-${raceNumber}-${runnerNumber}`];

                  const fallbackOdds = Object.entries(liveOdds).find(
                    ([key, value]: any) => {
                      const lowerKey = key.toLowerCase();
                      const lowerCourse = String(race.course || "").toLowerCase();

                      const courseMatch =
                        lowerKey.includes(lowerCourse) ||
                        lowerCourse.includes(
                          String(value?.course || "").toLowerCase()
                        );

                      const stateMatch =
                        value?.state &&
                        race.state &&
                        String(value.state).toLowerCase() ===
                          String(race.state).toLowerCase();

                      const raceMatch =
                        Number(value?.race_number) === Number(raceNumber);
                      const runnerMatch =
                        Number(value?.runner_number) === Number(runnerNumber);

                      return (courseMatch || stateMatch) && raceMatch && runnerMatch;
                    }
                  )?.[1] as any;

                  const odds = directOdds || fallbackOdds;

                  if (!odds) return null;

                  return (
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "10px",
                        borderRadius: "10px",
                        background: "rgba(56,189,248,0.08)",
                        border: "1px solid rgba(56,189,248,0.2)",
                        fontSize: "13px",
                      }}
                    >
                      <div style={{ color: "#38bdf8", fontWeight: 800 }}>
                        SB Place: ${odds.sportsbet_place || "-"} · LB Place: $
                        {odds.ladbrokes_place || "-"}
                      </div>

                      <div
                        style={{
                          marginTop: "4px",
                          color: "#94a3b8",
                          fontSize: "12px",
                        }}
                      >
                        SB Win: ${odds.sportsbet_win || "-"} · LB Win: $
                        {odds.ladbrokes_win || "-"}
                      </div>
                    </div>
                  );
                })()}

                <div
                  style={{
                    color: "#afacc15",
                    fontSize: "13px",
                    marginTop: "8px",
                    fontWeight: "700",
                  }}
                >
                  Click to view full race card
                </div>

                {bestRunner?.reasoning && (
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "14px",
                      borderRadius: "15px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#cbd5e1",
                      fontSize: "13px",
                      lineHeight: "1.6",
                    }}
                  >
                    <strong style={{ color: "#ffffff" }}>AI Reasoning</strong>

                    <ul style={{ margin: "6px 0 0 15px", padding: 0 }}>
                      {bestRunner.reasoning.map(
                        (reason: string, reasonIndex: number) => (
                          <li key={reasonIndex}>{reason}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                <div
                  style={{
                    display: "inline-block",
                    marginTop: "10px",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "600",
                    background: getDecisionBackground(bestRunner?.decision || "WATCH"),
color: getDecisionColor(bestRunner?.decision || "WATCH"),
                  }}
                >
                  {bestRunner?.decision || "WATCH"} ·{" "}
{getDecisionMeaning(bestRunner?.decision || "WATCH")}
                </div>
              </div>
            );
          })}
        </div>

        {selectedRace && (
          <div
  style={{
    position: "fixed",
top: "32px",
left: "50%",
transform: "translateX(-50%)",
width: "min(1200px, 94vw)",
height: "80vh",
minWidth: "620px",
minHeight: "420px",
maxWidth: "96vw",
maxHeight: "92vh",
overflow: "auto",
resize: "both",
    padding: "24px",
    border: "1px solid rgba(56,189,248,0.35)",
    borderRadius: "18px",
    background: "rgba(2,8,18,0.96)",
    boxShadow: "0 30px 90px rgba(0,0,0,0.75)",
    zIndex: 9999,
  }}
>
            <div
  style={{
    display: "grid",
    gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 500px)",
    gap: "22px",
    alignItems: "stretch",
    marginBottom: "16px",
  }}
>
  <div>
    <h2 style={{ margin: "0 0 14px 0" }}>
      {selectedRace.course} Race {selectedRace.race_number}
      {selectedRace.state ? ` (${selectedRace.state})` : ""}
    </h2>

    {(() => {
      const raceDateText = selectedRace.race_date
        ? new Date(`${selectedRace.race_date}T12:00:00`).toLocaleDateString("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "Not available";

      const melbourneTimeText = selectedRace.off_time
        ? new Date(selectedRace.off_time).toLocaleTimeString("en-AU", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: "Australia/Melbourne",
          })
        : "Not available";

      const localTrackTimeZone =
        selectedRace.state === "WA"
          ? "Australia/Perth"
          : selectedRace.state === "SA" || selectedRace.state === "NT"
          ? "Australia/Adelaide"
          : selectedRace.state === "QLD"
          ? "Australia/Brisbane"
          : selectedRace.state === "TAS"
          ? "Australia/Hobart"
          : selectedRace.state === "NSW" || selectedRace.state === "ACT"
          ? "Australia/Sydney"
          : "Australia/Melbourne";

      const localTrackTimeText = selectedRace.off_time
        ? new Date(selectedRace.off_time).toLocaleTimeString("en-AU", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: localTrackTimeZone,
          })
        : "Not available";

      return (
        <div
          style={{
            color: "#cbd5e1",
            fontSize: "15px",
            lineHeight: "1.65",
            marginBottom: "18px",
          }}
        >
          <div>Date: {raceDateText}</div>
          <div>Melbourne Time: {melbourneTimeText}</div>
          <div>
            Local Track Time: {localTrackTimeText}
            {selectedRace.timezone_label ? ` ${selectedRace.timezone_label}` : ""}
          </div>
          <div>Runners: {selectedRace.runners?.length || 0}</div>
          <div>Distance: {selectedRace.distance || "Not available"}</div>
        </div>
      );
    })()}

    <button
      onClick={() => setSelectedRace(null)}
      style={{
        padding: "8px 14px",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.06)",
        color: "#ffffff",
        cursor: "pointer",
      }}
    >
      Close
    </button>
  </div>

  <div
    style={{
      minHeight: "190px",
      borderRadius: "14px",
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.12)",
      backgroundImage: "url('/racehorse-bg.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}
  />
</div>

            <div
              style={{
                marginTop: "14px",
                padding: "12px",
                borderRadius: "12px",
                background: "rgba(56,189,248,0.10)",
                border: "1px solid rgba(56,189,248,0.18)",
              }}
            >
              <strong style={{ color: getDecisionColor(selectedBestRunner?.decision || "WATCH") }}>
  Value Selection:
</strong>
              {selectedBestRunner?.number ? ` ${selectedBestRunner.number}. ` : ""}
              {selectedBestRunner?.horse || "No selection"} ·{" "}
              {selectedBestRunner?.decision || "WATCH"} ·{" "}
{getDecisionMeaning(selectedBestRunner?.decision || "WATCH")} · Score{" "}
{selectedBestRunner?.score || 0}
            </div>

            <div style={{ overflowX: "auto", marginTop: "18px" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr style={{ color: "#94a3b8", textAlign: "left" }}>
  <th style={{ padding: "10px" }}>Rank</th>
  <th style={{ padding: "10px" }}>No.</th>
  <th style={{ padding: "10px" }}>Horse</th>
  <th style={{ padding: "10px" }}>Jockey</th>
  <th style={{ padding: "10px" }}>Trainer</th>
  <th style={{ padding: "10px" }}>Barrier</th>
  <th style={{ padding: "10px" }}>Weight</th>
  <th style={{ padding: "10px" }}>Form</th>
  <th style={{ padding: "10px" }}>Starts</th>
  <th style={{ padding: "10px" }}>Place %</th>
  <th style={{ padding: "10px" }}>SB Win</th>
  <th style={{ padding: "10px" }}>SB Place</th>
  <th style={{ padding: "10px" }}>LB Win</th>
  <th style={{ padding: "10px" }}>LB Place</th>
  <th style={{ padding: "10px" }}>AI</th>
  <th style={{ padding: "10px" }}>Reasoning</th>
</tr>
                </thead>

                <tbody>
                  {scoredRunners.map((runner: any, index: number) => (
                    <tr
                      key={`${runner.number}-${runner.horse}`}
                      style={{ color: "#cbd5e1" }}
                    >
                      <td style={{ padding: "10px" }}>#{index + 1}</td>
                      <td style={{ padding: "10px" }}>{runner.number || "-"}</td>
                      <td style={{ padding: "10px" }}>{runner.horse}</td>
                      <td style={{ padding: "10px" }}>{runner.jockey || "-"}</td>
                      <td style={{ padding: "10px" }}>{runner.trainer || "-"}</td>
                      <td style={{ padding: "10px" }}>{runner.draw || "-"}</td>
                      <td style={{ padding: "10px" }}>
                        {runner.weight || runner.lbs || "-"}
                      </td>
                      <td style={{ padding: "10px" }}>{runner.form || "-"}</td>
                      <td style={{ padding: "10px" }}>{runner.starts || "-"}</td>
                      <td style={{ padding: "10px" }}>
                        {runner.displayPlacePercent || 0}%
                      </td>
<td style={{ padding: "10px" }}>
  {runner.sportsbet_win ?? "Not available"}
</td>
<td style={{ padding: "10px" }}>
  {runner.sportsbet_place ?? "Not available"}
</td>
<td style={{ padding: "10px" }}>
  {runner.ladbrokes_win ?? "Not available"}
</td>
<td style={{ padding: "10px" }}>
  {runner.ladbrokes_place ?? "Not available"}
</td>
                      <td
                        style={{
                          padding: "10px",
                          color: getDecisionColor(runner.decision),
                          fontWeight: 800,
                        }}
                      >
                        {runner.decision} · {runner.score}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                          minWidth: "220px",
                          color: "#94a3b8",
                        }}
                      >
                        {getDecisionMeaning(runner.decision)} •{" "}
{runner.reasoning?.slice(0, 2).join(" • ") || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: "40px",
            padding: "20px",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            background: "rgba(2,8,18,0.45)",
            textAlign: "center",
          }}
        >
          <h2 style={{ marginBottom: "12px" }}>Track Record</h2>
          <p style={{ color: "#94a3b8", marginBottom: "18px" }}>
            View historical AI picks, saved races, and future performance
            tracking.
          </p>
          <a
            href="/track-record"
            style={{
              display: "inline-block",
              background: "#38bdf8",
              color: "#07111f",
              padding: "14px 28px",
              borderRadius: "12px",
              fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 10px 25px rgba(56,189,248,0.35)",
            }}
          >
            View Full Track Record
          </a>
        </div>

        <div style={{ marginTop: "40px", fontSize: "12px", color: "#94a3b8" }}>
          <a href="/privacy" style={{ marginRight: "10px" }}>
            Privacy Policy
          </a>
          <a href="/terms" style={{ marginRight: "10px" }}>
            Terms
          </a>
          <a href="/disclaimer">Disclaimer</a>
        </div>
      </div>
    </main>
  );
}
