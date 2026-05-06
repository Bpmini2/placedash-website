"use client";

import React, { useEffect, useState } from "react";

export default function Dashboard() {
  function getBestRunner(race) {
  if (!race.runners || race.runners.length === 0) return null;

  function countStarts(form) {
    if (!form) return 0;
    return form.replace(/[^0-9]/g, "").length;
  }

  function recentFormScore(form) {
    if (!form) return 0;

    const results = form
      .replace(/[^0-9]/g, "")
      .split("")
      .map(Number)
      .filter((n) => n > 0);

    if (results.length === 0) return 0;

    return results.slice(-3).reduce((score, result) => {
      if (result === 1) return score + 6;
      if (result === 2) return score + 5;
      if (result === 3) return score + 4;
      if (result <= 5) return score + 2;
      return score;
    }, 0);
  }

  return race.runners
    .filter((runner) => countStarts(runner.form) >= 3)
    .map((runner) => {
      let score = 0;

      score += recentFormScore(runner.form);

      if (runner.draw) {
        score += Math.max(0, 10 - parseInt(runner.draw));
      }

      if (runner.lbs) {
        score += Math.max(0, 140 - parseInt(runner.lbs)) / 10;
      }

      if (runner.jockey) score += 2;
      if (runner.trainer) score += 2;

      let confidence = "LOW";
      if (score >= 18) confidence = "HIGH";
      else if (score >= 10) confidence = "MEDIUM";

      return { ...runner, score, confidence };
    })
    .sort((a, b) => b.score - a.score)[0] || null;
}

  const [races, setRaces] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    async function loadRaces() {
      try {
  const res = await fetch("/api/formfav");
  const data = await res.json();

  setRaces(data.racecards || []);
      } catch (err) {
        console.error(err);
      }
    }

    loadRaces();
  }, []);
  

  return (
    <main style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1>Dashboard Preview</h1>
      <p style={{ color: "#94a3b8" }}>
  Today’s AI-powered place selections
</p>

<div style={{
  display: "inline-block",
  marginTop: "10px",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.12)",
  color: "#22c55e",
  fontSize: "12px",
  fontWeight: "600"
}}>
  ● Updated {new Date().toLocaleDateString("en-AU")} · Live race data
</div>

      <div style={{
  marginTop: "30px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "20px"
}}>
        {races.length === 0 && (
          <div style={{ padding: "20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", color: "#94a3b8" }}>
            Loading today’s race cards...
          </div>
        )}

        {races
          
          .filter((race) => race.runners.length >= 8 && race.runners.length <= 11)
          .filter((race) => {
            const best = getBestRunner(race);
            return best && (best.confidence === "HIGH" || best.confidence === "MEDIUM");
          })
          .slice(0, 3)
          .map((race, index) => {
          const isFreePick = index === 0;  
            const bestRunner = getBestRunner(race);

            return (
              <div
  key={index}
  onClick={() => window.location.href = "/#pricing"}
  style={{
    padding: "20px",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  }}
 >
   <h3>{race.course} Race {race.race_number || ""}</h3>

                <p style={{ color: "#94a3b8" }}>
                  {race.off_time} • {race.runners?.length || 0} runners
                </p>

                <p style={{ marginTop: "10px" }}>
                  <p style={{ marginTop: "10px" }}>
  Selection:{" "}
  <strong>
    {isFreePick
      ? bestRunner?.horse || "No selection"
      : "🔒 Upgrade to reveal pick"}
  </strong>
</p>
                <div style={{ color: "#facc15", fontSize: "12px", marginTop: "6px" }}>
  {bestRunner?.confidence === "HIGH"
    ? "🔥 High confidence pick available"
    : "AI-rated place selection available"}
</div>  
                </p>

                <div style={{
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
                      : "#ef4444"
                }}>
                  {isFreePick
  ? `${bestRunner?.confidence || "LOW"} CONFIDENCE`
  : "CONFIDENCE LOCKED"}
                </div>
              </div>
            );
          })}

        <div style={{ padding: "20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", opacity: 0.9 }}>
          <h3>Premium Picks Locked 🔒</h3>
          <p style={{ color: "#94a3b8" }}>Only 3 of today’s AI picks are visible — more high-confidence selections are locked.</p>
          <p style={{ color: "#facc15", fontWeight: "600" }}>
  ⚠ You’re missing today’s HIGH confidence selections
</p>
<p style={{ color: "#94a3b8" }}>
  Upgrade to unlock the strongest AI-rated picks.
</p>

          <a href="/#pricing" style={{
            display: "inline-block",
            marginTop: "15px",
            padding: "10px 16px",
            background: "#22c55e",
            color: "#000",
            borderRadius: "10px",
            fontWeight: "600"
          }}>
            Upgrade to Silver
          </a>
        </div>
      </div>

      <div style={{
        marginTop: "40px",
        padding: "20px",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "16px"
      }}>
        <h2 style={{ marginBottom: "15px" }}>Track Record</h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "15px"
        }}>
          <div style={{
            padding: "15px",
            background: "rgba(34,197,94,0.1)",
            borderRadius: "12px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>Last 7 Days</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#22c55e" }}>68%</div>
            <div style={{ fontSize: "12px" }}>Place Rate</div>
          </div>

          <div style={{
            padding: "15px",
            background: "rgba(34,197,94,0.1)",
            borderRadius: "12px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>Last 30 Days</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#22c55e" }}>+12%</div>
            <div style={{ fontSize: "12px" }}>ROI</div>
          </div>

          <div style={{
            padding: "15px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "12px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>Avg Odds</div>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>2.10</div>
          </div>
        </div>

        <p style={{ color: "#94a3b8", marginTop: "12px", fontSize: "12px" }}>
          *Past performance is not a guarantee of future results.
        </p>
      </div>
      <div style={{
  marginTop: "40px",
  padding: "20px",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "16px"
}}>
  <h2 style={{ marginBottom: "15px" }}>Recent Results</h2>

  <div style={{ display: "grid", gap: "10px" }}>
  {results.length === 0 ? (
    <p style={{ color: "#94a3b8" }}>No saved picks yet.</p>
  ) : (
    results.map((r, i) => (
  <div
    key={i}
    style={{
      padding: "10px 0",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    <div style={{ fontWeight: "700", color: "#ffffff" }}>
      {r.race} · {r.time || "TBA"}
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: "4px",
      }}
    >
      <span>Pick: {r.horse}</span>
      <span style={{ color: "#facc15", fontWeight: "700" }}>
        {r.confidence}
      </span>
    </div>

    <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
      Date: {r.date || "Today"}
    </div>
  </div>
))
    ))
  )}
</div>

  <p style={{ color: "#94a3b8", marginTop: "10px", fontSize: "12px" }}>
    Updated daily. Based on AI-selected runners.
  </p>
</div>
      <div style={{ marginTop: "40px", fontSize: "12px", color: "#94a3b8" }}>
  <a href="/privacy" style={{ marginRight: "10px" }}>Privacy Policy</a>
  <a href="/terms" style={{ marginRight: "10px" }}>Terms</a>
  <a href="/disclaimer">Disclaimer</a>
</div>
    </main>
  );
}
