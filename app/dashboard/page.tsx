"use client";

import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRace, setSelectedRace] = useState<any | null>(null);

  function countStarts(runner: any) {
    if (typeof runner.starts === "number") return runner.starts;
    if (!runner.form) return 0;
    return runner.form.replace(/[^0-9]/g, "").length;
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

    if (placePercent >= 55) reasons.push("Strong overall place record");
    else if (placePercent >= 40) reasons.push("Solid overall place record");

    if (runner.recentFormScore >= 65) reasons.push("Strong recent form");
    else if (runner.recentFormScore >= 45) reasons.push("Recent form support");

    if (starts >= 10) reasons.push("Experienced runner");
    else if (starts >= 3) reasons.push("Meets minimum race experience");

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

    if (reasons.length === 0) reasons.push("Limited data available");

    return Array.from(new Set(reasons)).slice(0, 5);
  }
    function scoreRunner(runner: any) {
    const starts = countStarts(runner);
    const wins = Number(runner.wins || 0);
    const places = Number(runner.places || 0);

    const horsePlacePercent =
      typeof runner.placePercent === "number"
        ? runner.placePercent * 100
        : starts > 0
        ? (places / starts) * 100
        : 0;

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
    if (score >= 65) confidence = "HIGH";
    else if (score >= 45) confidence = "MEDIUM";

    const scoredRunner = {
      ...runner,
      score: Math.round(score),
      confidence,
      starts,
      recentFormScore: recentForm,
      displayPlacePercent: Math.round(horsePlacePercent),
      specialistNotes: specialist.notes,
      weightNote: weight.note,
    };

    return {
      ...scoredRunner,
      reasoning: getRunnerReasoning(scoredRunner),
    };
  };

  function getBestRunner(race: any) {
    if (!race.runners || race.runners.length === 0) return null;

    return (
      race.runners
        .filter((runner: any) => countStarts(runner) >= 3)
        .filter((runner: any) => !runner.scratched)
        .map((runner: any) => scoreRunner(runner))
        .sort((a: any, b: any) => b.score - a.score)[0] || null
    );
  }

  function getScoredRunners(race: any) {
    if (!race?.runners || race.runners.length === 0) return [];

    return race.runners
      .map((runner: any) => scoreRunner(runner))
      .sort((a: any, b: any) => b.score - a.score);
  }

  useEffect(() => {
    async function loadRaces() {
      try {
        const res = await fetch("/api/formfav");
        const data = await res.json();

        setRaces(data.racecards || []);
        setLoading(false);
      } catch (err) {
        console.error(err);
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
      const best = getBestRunner(race);
      return best && (best.confidence === "HIGH" || best.confidence === "MEDIUM");
    })
    .slice(0, 3);

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
                  background: "#20c865",
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
              <a href="/" style={{ color: "#07111f", fontWeight: 700, textDecoration: "none" }}>
                Home
              </a>
              <a href="/track-record" style={{ color: "#07111f", fontWeight: 700, textDecoration: "none" }}>
                Track Record
              </a>
              <a href="/#pricing" style={{ color: "#07111f", fontWeight: 700, textDecoration: "none" }}>
                Pricing
              </a>
            </nav>

            <a
              href="/"
              style={{
                background: "#20c865",
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
              background: "rgba(34,197,94,0.14)",
              color: "#22c55e",
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
            Today’s AI Dashboard
          </h1>
        </div>

        <p style={{ color: "#b7c5d8", fontSize: "17px", marginTop: "-12px", marginBottom: "18px" }}>
          AI-powered place selections for Australian racing.
        </p>

        <div style={{ display: "inline-block", marginTop: "10px", padding: "6px 10px", borderRadius: "999px", background: "rgba(34,197,94,0.12)", color: "#22c55e", fontSize: "12px", fontWeight: "600" }}>
          ● Updated {new Date().toLocaleDateString("en-AU")} · Live race data
        </div>

        <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "8px" }}>
          Race times are shown in the local track timezone.
        </p>

        <div style={{ marginTop: "28px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "28px" }}>
          {loading && (
            <div style={{ padding: "20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", color: "#94a3b8" }}>
              Loading today’s race cards...
            </div>
          )}

          {!loading && displayRaces.length === 0 && (
            <div style={{ padding: "26px", background: "rgba(15,23,42,0.58)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: "22px", boxShadow: "0 18px 45px rgba(0,0,0,0.28)", backdropFilter: "blur(14px)", color: "#b7c5d8" }}>
              <strong style={{ color: "#ffffff", fontSize: "18px" }}>
                No qualifying races found right now.
              </strong>
              <p style={{ marginTop: "10px", lineHeight: 1.6 }}>
                PlaceDash only shows Australian races with 8–11 active runners, no first starters, and races that have not already started.
              </p>
              <p style={{ marginTop: "10px", color: "#94a3b8", lineHeight: 1.6 }}>
                Live qualifying races will appear automatically when available.
              </p>
            </div>
          )}

          {displayRaces.map((race: any, index: number) => {
            const isFreePick = index === 0;
            const bestRunner = getBestRunner(race);
            const visibleHorse = `${bestRunner?.number ? bestRunner.number + ". " : ""}${bestRunner?.horse || "No selection"}`;

            return (
              <div
                key={`${race.course}-${race.race_number}`}
                onClick={() => {
                  if (isFreePick) setSelectedRace(race);
                  else window.location.href = "/#pricing";
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

                <p style={{ color: "#94a3b8" }}>
                  {race.off_time} {race.timezone_label || ""} • {race.runners?.length || 0} runners
                </p>

                <p style={{ marginTop: "10px" }}>
                  Selection: <strong>{isFreePick ? visibleHorse : "🔒 Upgrade to reveal pick"}</strong>
                </p>

                <div style={{ color: "#facc15", fontSize: "13px", marginTop: "8px", fontWeight: "700" }}>
                  {isFreePick ? "Click to view full race card" : "AI-rated place selection available"}
                </div>

                {isFreePick && bestRunner?.reasoning && (
                  <div style={{ marginTop: "14px", padding: "14px", borderRadius: "16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1", fontSize: "13px", lineHeight: "1.6" }}>
                    <strong style={{ color: "#ffffff" }}>AI Reasoning</strong>
                    <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                      {bestRunner.reasoning.map((reason: string, reasonIndex: number) => (
                        <li key={reasonIndex}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: "inline-block", marginTop: "10px", padding: "6px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", background: bestRunner?.confidence === "HIGH" ? "rgba(34,197,94,0.15)" : "rgba(250,204,21,0.15)", color: bestRunner?.confidence === "HIGH" ? "#22c55e" : "#facc15" }}>
                  {isFreePick ? `${bestRunner?.confidence || "LOW"} CONFIDENCE` : "CONFIDENCE LOCKED"}
                </div>
              </div>
            );
          })}

          <div style={{ padding: "20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", opacity: 0.9, background: "rgba(2,8,18,0.45)" }}>
            <h3>Premium Picks Locked 🔒</h3>
            <p style={{ color: "#94a3b8" }}>
              Only 3 of today’s AI picks are visible — more high-confidence selections are locked.
            </p>
            <p style={{ color: "#facc15", fontWeight: "600" }}>
              ⚠ You’re missing today’s HIGH confidence selections
            </p>
            <p style={{ color: "#94a3b8" }}>
              Upgrade to unlock the strongest AI-rated picks.
            </p>
            <a href="/#pricing" style={{ display: "inline-block", marginTop: "15px", padding: "10px 16px", background: "#22c55e", color: "#000", borderRadius: "10px", fontWeight: "600" }}>
              Upgrade to Silver
            </a>
          </div>
        </div>

        {selectedRace && (
          <div style={{ marginTop: "40px", padding: "20px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", background: "rgba(2,8,18,0.72)" }}>
            <h2>
              {selectedRace.course} Race {selectedRace.race_number}
              {selectedRace.state ? ` (${selectedRace.state})` : ""}
            </h2>

            <p style={{ color: "#94a3b8" }}>
              {selectedRace.off_time} {selectedRace.timezone_label || ""} · {selectedRace.runners?.length || 0} runners · {selectedRace.distance || "Distance TBA"}
            </p>

            <button onClick={() => setSelectedRace(null)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.04)", color: "#ffffff", cursor: "pointer" }}>
              Close
            </button>

            <div style={{ marginTop: "14px", padding: "12px", borderRadius: "12px", background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.18)" }}>
              <strong style={{ color: "#22c55e" }}>Top Rated Selection: </strong>
              {selectedBestRunner?.number ? `${selectedBestRunner.number}. ` : ""}
              {selectedBestRunner?.horse || "No selection"} · {selectedBestRunner?.confidence || "LOW"} confidence · Score {selectedBestRunner?.score || 0}
            </div>

            <div style={{ overflowX: "auto", marginTop: "18px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
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
<th style={{ padding: "10px" }}>AI</th>
<th style={{ padding: "10px" }}>Reasoning</th>
                      </tr>
</thead>

<tbody>
  {scoredRunners.map((runner: any, index: number) => (
    <tr key={`${runner.number}-${runner.horse}`} style={{ color: "#cbd5e1" }}>
                      <td style={{ padding: "10px" }}>#{index + 1}</td>
                      <td style={{ padding: "10px" }}>{runner.number || "-"}</td>

<td style={{ padding: "10px" }}>
  {runner.horse}
</td>

<td style={{ padding: "10px" }}>
  {runner.jockey || "-"}
</td>

<td style={{ padding: "10px" }}>
  {runner.trainer || "-"}
</td>

<td style={{ padding: "10px" }}>
  {runner.draw || "-"}
</td>

<td style={{ padding: "10px" }}>
  {runner.weight || runner.lbs || "-"}
</td>

<td style={{ padding: "10px" }}>
  {runner.form || "-"}
</td>

<td style={{ padding: "10px" }}>
  {runner.starts || "-"}
</td>

<td style={{ padding: "10px" }}>
  {runner.displayPlacePercent || 0}%
</td>

<td style={{ padding: "10px" }}>
  {runner.confidence} · {runner.score}
</td>

<td style={{ padding: "10px", minWidth: "220px", color: "#94a3b8" }}>
  {runner.reasoning?.slice(0, 2).join(" • ") || "-"}
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ marginTop: "40px", padding: "20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", background: "rgba(2,8,18,0.45)", textAlign: "center" }}>
          <h2 style={{ marginBottom: "12px" }}>Track Record</h2>
          <p style={{ color: "#94a3b8", marginBottom: "18px" }}>
            View historical AI picks, saved races, and future performance tracking.
          </p>
          <a href="/track-record" style={{ display: "inline-block", background: "#22c55e", color: "#07111f", padding: "14px 28px", borderRadius: "12px", fontWeight: 800, textDecoration: "none", boxShadow: "0 10px 25px rgba(34,197,94,0.35)" }}>
            View Full Track Record
          </a>
        </div>

        <div style={{ marginTop: "40px", fontSize: "12px", color: "#94a3b8" }}>
          <a href="/privacy" style={{ marginRight: "10px" }}>Privacy Policy</a>
          <a href="/terms" style={{ marginRight: "10px" }}>Terms</a>
          <a href="/disclaimer">Disclaimer</a>
        </div>
      </div>
    </main>
  );
}  
