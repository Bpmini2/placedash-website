"use client";

import React, { useEffect, useState } from "react";

export default function AdminPicksPage() {
  const [picks, setPicks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <main style={{ padding: "40px", background: "#07111f", minHeight: "100vh", color: "white" }}>
      <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>Admin AI Picks</h1>
      <p style={{ color: "#94a3b8", marginBottom: "30px" }}>
        Full internal view of all saved PlaceDash AI selections.
      </p>

      {loading ? (
        <p>Loading picks...</p>
      ) : picks.length === 0 ? (
        <p>No saved picks found.</p>
      ) : (
        <div style={{ display: "grid", gap: "28px" }}>
  {Object.entries(
    picks.reduce((groups: any, pick: any) => {
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
              {pick.confidence || "Pending"} · Score: {pick.ai_score || 0}
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
