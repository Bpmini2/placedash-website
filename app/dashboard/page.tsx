"use client";

import React, { useEffect, useState } from "react";

export default function Dashboard() {

  function getBestRunner(race) {
    if (!race.runners || race.runners.length === 0) return null;

    return race.runners
      .map((runner) => {
        let score = 0;

        if (runner.form) score += 2;
        if (runner.draw) score += Math.max(0, 10 - parseInt(runner.draw));
        if (runner.lbs) score += Math.max(0, 140 - parseInt(runner.lbs)) / 10;

        let confidence = "LOW";
        if (score >= 12) confidence = "HIGH";
        else if (score >= 6) confidence = "MEDIUM";

        return { ...runner, score, confidence };
      })
      .sort((a, b) => b.score - a.score)[0];
  }

  const [races, setRaces] = useState([]);

  useEffect(() => {
    const options = {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "2cb26d22fcmsh44c3a843555e9fdp1727d5jsnb5263c409eaf",
        "X-RapidAPI-Host": "the-racing-api1.p.rapidapi.com"
      }
    };

    fetch("https://the-racing-api1.p.rapidapi.com/v1/racecards/free?day=today", options)
      .then((res) => res.json())
      .then((data) => {
        setRaces(data.racecards || data.data?.racecards || []);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <main style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      
      <h1>Dashboard Preview</h1>
      <p style={{ color: "#94a3b8" }}>Today’s AI-powered place selections</p>

      <div style={{ marginTop: "30px", display: "grid", gap: "20px" }}>

        {races.length === 0 && (
          <div style={{ padding: "20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", color: "#94a3b8" }}>
            Loading today’s race cards...
          </div>
        )}

        {races
          .filter(race => race.region === "GB")
          .filter(race => race.runners.length >= 8 && race.runners.length <= 11)
          .filter(race => {
            const best = getBestRunner(race);
            return best && (best.confidence === "HIGH" || best.confidence === "MEDIUM");
          })
          .slice(0, 3)
          .map((race, index) => {
            const bestRunner = getBestRunner(race);

            return (
              <div key={index} style={{ padding: "20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px" }}>
                
                <h3>{race.course} Race {race.race_number}</h3>

                <p style={{ color: "#94a3b8" }}>
                  {race.off_time} • {race.runners?.length || 0} runners
                </p>

                <p style={{ marginTop: "10px" }}>
                  Selection: <strong>🔒 Locked (Upgrade Required)</strong>
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
  {bestRunner?.confidence || "LOW"} CONFIDENCE
</div>
                      ? "#22c55e"
                      : bestRunner?.confidence === "MEDIUM"
                      ? "#facc15"
                      : "#ef4444"
                }}>
                  {bestRunner?.confidence || "LOW"} CONFIDENCE
                </span>

              </div>
            );
          })}

        <div style={{ padding: "20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", opacity: 0.9 }}>
          <h3>Premium Picks Locked 🔒</h3>
          <p style={{ color: "#94a3b8" }}>You’re viewing limited selections today.</p>
          <p>Upgrade to unlock the remaining high-confidence picks.</p>

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

    </main>
  );
}
