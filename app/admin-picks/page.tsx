"use client";

import React, { useEffect, useState } from "react";

export default function AdminPicksPage() {
  const [picks, setPicks] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [selectedTrack, setSelectedTrack] = useState("All Tracks");

  useEffect(() => {
    async function loadPicks() {
      try {
        const res = await fetch("/api/admin-picks");
        const data = await res.json();
        setPicks(data.picks || []);
      } catch (error) {
        console.error("Failed to load admin picks", error);
      } finally {
        setLoading(false);
      }
    }

    loadPicks();
  }, []);
const trackNames = Array.from(
  new Set(picks.map((pick) => pick.course || "Unknown Track"))
).sort();

const filteredPicks =
  selectedTrack === "All Tracks"
    ? picks
    : picks.filter((pick) => pick.course === selectedTrack);
  return (
    <main style={{ padding: "40px", background: "#07111f", minHeight: "100vh", color: "white" }}>
      <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>Admin AI Picks</h1>
      <p style={{ color: "#94a3b8", marginBottom: "30px" }}>
        Full internal view of all saved PlaceDash AI selections.
      </p>
<div style={{ marginBottom: "28px" }}>
  <label
    style={{
      display: "block",
      marginBottom: "8px",
      color: "#94a3b8",
      fontWeight: 700,
    }}
  >
    Filter by race track
  </label>

  <select
    value={selectedTrack}
    onChange={(e) => setSelectedTrack(e.target.value)}
    style={{
      padding: "12px 16px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.18)",
      background: "#111827",
      color: "white",
      fontSize: "16px",
      fontWeight: 700,
    }}
  >
    <option>All Tracks</option>
    {trackNames.map((track) => (
      <option key={track}>{track}</option>
    ))}
  </select>
</div>
      {loading ? (
        <p>Loading picks...</p>
      ) : picks.length === 0 ? (
        <p>No saved picks found.</p>
      ) : (
        <div style={{ display: "grid", gap: "28px" }}>
  {Object.entries(
    filteredPicks.reduce((groups: any, pick: any) => {
      const course = pick.course || "Unknown Track";

      if (!groups[course]) {
        groups[course] = [];
      }

      groups[course].push(pick);
      return groups;
    }, {})
  ).map(([course, coursePicks]: any) => (
    <section key={course}>
      <h2
        style={{
          fontSize: "28px",
          margin: "0 0 14px",
          color: "#22c55e",
        }}
      >
        {course}
      </h2>

      <div style={{ display: "grid", gap: "14px" }}>
        {coursePicks.map((pick: any, index: number) => (
          <div
            key={pick.id || index}
            style={{
              padding: "18px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <h3 style={{ margin: "0 0 8px" }}>
              Race {pick.race_number} — {pick.horse_number}. {pick.horse_name}
            </h3>

            <p style={{ margin: "4px 0", color: "#dbeafe" }}>
              Time: {pick.race_time || "TBA"} · Confidence:{" "}
<span
  style={{
    color:
      pick.confidence === "HIGH"
        ? "#22c55e"
        : pick.confidence === "MEDIUM"
        ? "#facc15"
        : pick.confidence === "LOW"
        ? "#ef4444"
        : "#94a3b8",
    fontWeight: 900,
  }}
>
  {pick.confidence || "Pending"}
</span>{" "}
· Score: {pick.ai_score || 0}
            </p>

            <p style={{ margin: "4px 0", color: "#94a3b8" }}>
              Reasoning: {pick.reasoning || "No reasoning saved"}
            </p>

            <p style={{ margin: "4px 0", color: "#94a3b8" }}>
              Result: {pick.result || "pending"} · Placed:{" "}
              {String(pick.placed ?? "pending")} · Profit/Loss: $
              {pick.profit_loss ?? 0}
            </p>
          </div>
        ))}
      </div>
    </section>
  ))}
</div>
      )}
    </main>
  );
}
