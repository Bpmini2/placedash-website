"use client";

import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  function getBestRunner(race) {
    if (!race.runners || race.runners.length === 0) return null;

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

    return (
      race.runners
        .filter((runner) => countStarts(runner) >= 3)
        .map((runner) => {
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

          return {
            ...runner,
            score: Math.round(score),
            confidence,
          };
        })
        .sort((a, b) => b.score - a.score)[0] || null
    );
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
      race: `${race.course || "Unknown"} Race ${race.race_number || ""}`,
      time: race.off_time || "TBA",
      horse: `${bestRunner?.number ? bestRunner.number + ". " : ""}${
        bestRunner?.horse || "No selection"
      }`,
      confidence: bestRunner?.confidence || "LOW",
      date: new Date().toLocaleDateString("en-AU"),
    };
  });

  return (
    <main style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1>Dashboard Preview</h1>

      <p style={{ color: "#94a3b8" }}>
        Today’s AI-powered place selections
      </p>

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
              PlaceDash only shows Australian races with 8–11 runners and no
              first starters. Please check back later when more race data is
              available.
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
              onClick={() => (window.location.href = "/#pricing")}
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
              </h3>

              <p style={{ color: "#94a3b8" }}>
                {race.off_time} • {race.runners?.length || 0} runners
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
                AI-rated place selection available
              </div>
{isFreePick && (
  <div
    style={{
      marginTop: "10px",
      padding: "10px",
      borderRadius: "10px",
      background: "rgba(255,255,255,0.04)",
      color: "#94a3b8",
      fontSize: "12px",
      lineHeight: "1.4",
    }}
  >
    <strong style={{ color: "#ffffff" }}>Why this pick?</strong>
    <br />
    Good place record · Recent form support · Meets PlaceDash race filters
  </div>
)}
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
