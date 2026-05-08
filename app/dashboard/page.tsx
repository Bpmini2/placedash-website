"use client";

import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRace, setSelectedRace] = useState(null);

  function countStarts(runner) {
    if (typeof runner.starts === "number") return runner.starts;
    if (!runner.form) return 0;
    return runner.form.replace(/[^0-9]/g, "").length;
  }

  function evaluateRecentForm(form) {
    if (!form) return 30;

    const results = form
      .replace(/[^0-9]/g, "")
      .split("")
      .map(Number)
      .filter((n) => n > 0);

    if (results.length === 0) return 30;

    const lastThree = results.slice(-3);

    const score = lastThree.reduce((total, result) => {
      if (result === 1) return total + 90;
      if (result === 2) return total + 70;
      if (result === 3) return total + 55;
      if (result <= 5) return total + 35;
      return total + 15;
    }, 0);

    return Math.round(score / lastThree.length);
  }

  function getRunnerReasoning(runner) {
    const reasons = [];
    const starts = Number(runner.starts || 0);
    const places = Number(runner.places || 0);
    const placePercent = Number(runner.displayPlacePercent || 0);
    const score = Number(runner.score || 0);

    if (placePercent >= 50) {
      reasons.push("Strong place record");
    } else if (placePercent >= 35) {
      reasons.push("Solid place record");
    }

    if (starts >= 10) {
      reasons.push("Experienced runner");
    } else if (starts >= 3) {
      reasons.push("Meets minimum race experience");
    }

    if (runner.form) {
      reasons.push("Recent form support");
    }

    if (runner.draw && Number(runner.draw) > 0 && Number(runner.draw) <= 6) {
      reasons.push("Favourable barrier");
    }

    if (runner.jockey) {
      reasons.push("Jockey data available");
    }

    if (runner.trainer) {
      reasons.push("Trainer data available");
    }

    if (score >= 60) {
      reasons.push("High AI score");
    } else if (score >= 40) {
      reasons.push("Medium AI score");
    }

    if (reasons.length === 0) {
      reasons.push("Limited data available");
    }

    return reasons.slice(0, 4);
  }

  function scoreRunner(runner) {
    const starts = countStarts(runner);
    const wins = Number(runner.wins || 0);
    const places = Number(runner.places || 0);

    const horsePlacePercent =
      typeof runner.placePercent === "number"
        ? runner.placePercent * 100
        : starts > 0
        ? ((wins + places) / starts) * 100
        : 0;

    const horseWinPercent =
      typeof runner.winPercent === "number"
        ? runner.winPercent * 100
        : starts > 0
        ? (wins / starts) * 100
        : 0;

    const recentForm = evaluateRecentForm(runner.form);

    let score = 0;

    score += horsePlacePercent * 0.45;
    score += horseWinPercent * 0.15;
    score += recentForm * 0.25;

    if (runner.jockey) score += 5;
    if (runner.trainer) score += 5;

    if (runner.draw) {
      score += Math.max(0, 10 - parseInt(String(runner.draw))) * 0.5;
    }

    score = Math.min(100, Math.max(0, score));

    let confidence = "LOW";
    if (score >= 60) confidence = "HIGH";
    else if (score >= 40) confidence = "MEDIUM";

    const scoredRunner = {
      ...runner,
      score: Math.round(score),
      confidence,
      starts,
      displayPlacePercent: Math.round(horsePlacePercent),
    };

    return {
      ...scoredRunner,
      reasoning: getRunnerReasoning(scoredRunner),
    };
  }

  function getBestRunner(race) {
    if (!race.runners || race.runners.length === 0) return null;

    return (
      race.runners
        .filter((runner) => countStarts(runner) >= 3)
        .map((runner) => scoreRunner(runner))
        .sort((a, b) => b.score - a.score)[0] || null
    );
  }

  function getScoredRunners(race) {
    if (!race?.runners || race.runners.length === 0) return [];

    return race.runners
      .map((runner) => scoreRunner(runner))
      .sort((a, b) => b.score - a.score);
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
    .filter((race) => {
      const runnerCount = race.runners?.length || 0;
      return runnerCount >= 8 && runnerCount <= 11;
    })
    .filter((race) => {
      const best = getBestRunner(race);
      return best && (best.confidence === "HIGH" || best.confidence === "MEDIUM");
    })
    .slice(0, 3);

  const recentPicks = displayRaces.map((race) => {
    const bestRunner = getBestRunner(race);

    return {
      race: `${race.course || "Unknown"} Race ${race.race_number || ""}${
        race.state ? ` (${race.state})` : ""
      }`,
      time: `${race.off_time || "TBA"}${
        race.timezone_label ? ` ${race.timezone_label}` : ""
      }`,
      horse: `${bestRunner?.number ? bestRunner.number + ". " : ""}${
        bestRunner?.horse || "No selection"
      }`,
      confidence: bestRunner?.confidence || "LOW",
      date: new Date().toLocaleDateString("en-AU"),
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
      <h1>Dashboard Preview</h1>

      <p style={{ color: "#94a3b8" }}>Today’s AI-powered place selections</p>

      <div
        style={{
          display: "inline-block",
          marginTop: "10px",
          padding: "6px 10px",
          borderRadius: "999px",
          background: "rgba(34,197,94,0.12)",
          color: "#22c55e",
          fontSize: "12px",
          fontWeight: "600",
        }}
      >
        ● Updated {new Date().toLocaleDateString("en-AU")} · Live race data
      </div>

      <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "8px" }}>
        Race times are shown in the local track timezone.
      </p>

      <div
        style={{
          marginTop: "30px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
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
              padding: "20px",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              color: "#94a3b8",
            }}
          >
            <strong style={{ color: "#ffffff" }}>
              No qualifying races found today.
            </strong>
            <p style={{ marginTop: "8px" }}>
              PlaceDash only shows Australian races with 8–11 runners, no first
              starters, and races that have not already started. Please check
              back later when more race data is available.
            </p>
          </div>
        )}

        {displayRaces.map((race, index) => {
          const isFreePick = index === 0;
          const bestRunner = getBestRunner(race);

          const visibleHorse = `${bestRunner?.number ? bestRunner.number + ". " : ""}${
            bestRunner?.horse || "No selection"
          }`;

          return (
            <div
              key={`${race.course}-${race.race_number}`}
              onClick={() => {
                if (isFreePick) {
                  setSelectedRace(race);
                } else {
                  window.location.href = "/#pricing";
                }
              }}
              style={{
                padding: "20px",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <h3>
                {race.course} Race {race.race_number || ""}
                {race.state ? ` (${race.state})` : ""}
              </h3>

              <p style={{ color: "#94a3b8" }}>
                {race.off_time} {race.timezone_label || ""} •{" "}
                {race.runners?.length || 0} runners
              </p>

              <p style={{ marginTop: "10px" }}>
                Selection:{" "}
                <strong>
                  {isFreePick ? visibleHorse : "🔒 Upgrade to reveal pick"}
                </strong>
              </p>

              <div
                style={{
                  color: "#facc15",
                  fontSize: "12px",
                  marginTop: "6px",
                }}
              >
                {isFreePick
                  ? "Click to view full race card"
                  : "AI-rated place selection available"}
              </div>

              {isFreePick && bestRunner?.reasoning && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.04)",
                    color: "#94a3b8",
                    fontSize: "12px",
                    lineHeight: "1.5",
                  }}
                >
                  <strong style={{ color: "#ffffff" }}>AI Reasoning</strong>
                  <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                    {bestRunner.reasoning.map((reason, reasonIndex) => (
                      <li key={reasonIndex}>{reason}</li>
                    ))}
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
                  background:
                    bestRunner?.confidence === "HIGH"
                      ? "rgba(34,197,94,0.15)"
                      : bestRunner?.confidence === "MEDIUM"
                      ? "rgba(250,204,21,0.15)"
                      : "rgba(239,68,68,0.15)",
                  color:
                    bestRunner?.confidence === "HIGH"
                      ? "#22c55e"
                      : bestRunner?.confidence === "MEDIUM"
                      ? "#facc15"
                      : "#ef4444",
                }}
              >
                {isFreePick
                  ? `${bestRunner?.confidence || "LOW"} CONFIDENCE`
                  : "CONFIDENCE LOCKED"}
              </div>
            </div>
          );
        })}

        <div
          style={{
            padding: "20px",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            opacity: 0.9,
          }}
        >
          <h3>Premium Picks Locked 🔒</h3>

          <p style={{ color: "#94a3b8" }}>
            Only 3 of today’s AI picks are visible — more high-confidence
            selections are locked.
          </p>

          <p style={{ color: "#facc15", fontWeight: "600" }}>
            ⚠ You’re missing today’s HIGH confidence selections
          </p>

          <p style={{ color: "#94a3b8" }}>
            Upgrade to unlock the strongest AI-rated picks.
          </p>

          <a
            href="/#pricing"
            style={{
              display: "inline-block",
              marginTop: "15px",
              padding: "10px 16px",
              background: "#22c55e",
              color: "#000",
              borderRadius: "10px",
              fontWeight: "600",
            }}
          >
            Upgrade to Silver
          </a>
        </div>
      </div>

      {selectedRace && (
        <div
          style={{
            marginTop: "40px",
            padding: "20px",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "16px",
            background: "rgba(2,8,18,0.72)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "20px",
              alignItems: "flex-start",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2 style={{ marginBottom: "8px" }}>
                {selectedRace.course} Race {selectedRace.race_number}
                {selectedRace.state ? ` (${selectedRace.state})` : ""}
              </h2>

              <p style={{ color: "#94a3b8", margin: 0 }}>
                {selectedRace.off_time} {selectedRace.timezone_label || ""} ·{" "}
                {selectedRace.runners?.length || 0} runners ·{" "}
                {selectedRace.distance || "Distance TBA"}
              </p>

              <p style={{ color: "#94a3b8", marginTop: "6px" }}>
                Condition: {selectedRace.condition || "TBA"} · Weather:{" "}
                {selectedRace.weather || "TBA"}
              </p>
            </div>

            <button
              onClick={() => setSelectedRace(null)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.04)",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>

          <div
            style={{
              marginBottom: "14px",
              padding: "12px",
              borderRadius: "12px",
              background: "rgba(34,197,94,0.10)",
              border: "1px solid rgba(34,197,94,0.18)",
            }}
          >
            <strong style={{ color: "#22c55e" }}>AI Pick: </strong>
            {selectedBestRunner?.number ? `${selectedBestRunner.number}. ` : ""}
            {selectedBestRunner?.horse || "No selection"} ·{" "}
            {selectedBestRunner?.confidence || "LOW"} confidence · Score{" "}
            {selectedBestRunner?.score || 0}

            {selectedBestRunner?.reasoning && (
              <div style={{ marginTop: "10px", color: "#cbd5e1" }}>
                <strong style={{ color: "#ffffff" }}>Why this pick?</strong>
                <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                  {selectedBestRunner.reasoning.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr style={{ color: "#94a3b8", textAlign: "left" }}>
                  <th style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>No.</th>
                  <th style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Horse</th>
                  <th style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Jockey</th>
                  <th style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Trainer</th>
                  <th style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Barrier</th>
                  <th style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Form</th>
                  <th style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Starts</th>
                  <th style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Places</th>
                  <th style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Place %</th>
                  <th style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>AI</th>
                  <th style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Reasoning</th>
                </tr>
              </thead>

              <tbody>
                {scoredRunners.map((runner) => {
                  const isAiPick =
                    selectedBestRunner &&
                    runner.horse === selectedBestRunner.horse &&
                    runner.number === selectedBestRunner.number;

                  return (
                    <tr
                      key={`${runner.number}-${runner.horse}`}
                      style={{
                        background: isAiPick
                          ? "rgba(34,197,94,0.12)"
                          : "transparent",
                        color: isAiPick ? "#ffffff" : "#cbd5e1",
                      }}
                    >
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{runner.number || "-"}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: isAiPick ? "700" : "500" }}>
                        {runner.horse}
                        {isAiPick && (
                          <span style={{ color: "#22c55e", marginLeft: "8px" }}>
                            AI Pick
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{runner.jockey || "-"}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{runner.trainer || "-"}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{runner.draw || "-"}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{runner.form || "-"}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{runner.starts || 0}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{runner.places || 0}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{runner.displayPlacePercent || 0}%</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <span
                          style={{
                            padding: "5px 8px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: "700",
                            color:
                              runner.confidence === "HIGH"
                                ? "#22c55e"
                                : runner.confidence === "MEDIUM"
                                ? "#facc15"
                                : "#ef4444",
                            background:
                              runner.confidence === "HIGH"
                                ? "rgba(34,197,94,0.12)"
                                : runner.confidence === "MEDIUM"
                                ? "rgba(250,204,21,0.12)"
                                : "rgba(239,68,68,0.12)",
                          }}
                        >
                          {runner.confidence} · {runner.score}
                        </span>
                      </td>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                        {(runner.reasoning || []).slice(0, 2).join(" · ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "12px" }}>
            Odds are not shown yet. This table uses available FormFav form data
            and PlaceDash scoring.
          </p>
        </div>
      )}

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
        }}
      >
        <h2 style={{ marginBottom: "15px" }}>Demo Track Record</h2>

        <div
          style={{
            padding: "20px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "12px",
            marginTop: "15px",
          }}
        >
          <h3 style={{ marginBottom: "8px" }}>Track Record Coming Soon</h3>
          <p style={{ color: "#94a3b8", margin: 0 }}>
            Results will appear once PlaceDash starts tracking completed races.
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
        }}
      >
        <h2 style={{ marginBottom: "15px" }}>Today’s Race Summary</h2>

        <div style={{ display: "grid", gap: "10px" }}>
          {recentPicks.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>No saved picks yet.</p>
          ) : (
            recentPicks.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontWeight: "700", color: "#ffffff" }}>
                  {r.race} · {r.time}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "4px",
                  }}
                >
                  <span>
                    Pick: {i === 0 ? r.horse : "🔒 Upgrade to reveal pick"}
                  </span>
                  <span style={{ color: "#facc15", fontWeight: "700" }}>
                    {r.confidence}
                  </span>
                </div>

                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  Date: {r.date}
                </div>
              </div>
            ))
          )}
        </div>

        <p style={{ color: "#94a3b8", marginTop: "10px", fontSize: "12px" }}>
          Updated daily. Locked selections are available to upgraded members.
        </p>
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
    </main>
  );
}
