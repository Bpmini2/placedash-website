"use client";

import React, { useEffect, useState } from "react";

export default function TrackRecordPage() {
  const [picks, setPicks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSavedPicks() {
      try {
        const res = await fetch("/api/saved-picks");
        const data = await res.json();
        setPicks(data.picks || []);
      } catch (err) {
        console.error("Failed to load saved picks", err);
      } finally {
        setLoading(false);
      }
    }

    loadSavedPicks();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 48px",
        backgroundImage:
          'linear-gradient(rgba(2,8,18,0.86), rgba(2,8,18,0.93)), url("/racehorse-bg.png")',
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
        color: "#ffffff",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <header
          style={{
            width: "100%",
            marginBottom: "50px",
            background: "#f3f4f6",
            border: "1px solid rgba(255,255,255,0.95)",
            borderRadius: "26px",
            padding: "20px 34px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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

          <a
            href="/dashboard"
            style={{
              background: "#20c865",
              color: "#07111f",
              padding: "18px 34px",
              borderRadius: "16px",
              fontWeight: 800,
              fontSize: "17px",
              textDecoration: "none",
              boxShadow: "0 16px 35px rgba(32,200,101,0.35)",
            }}
          >
            Back to Dashboard
          </a>
        </header>

        <div style={{ marginBottom: "28px" }}>
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
            Saved AI Picks
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "58px",
              lineHeight: "1.02",
              letterSpacing: "-2px",
            }}
          >
            Track Record
          </h1>

          <p style={{ color: "#b7c5d8", fontSize: "17px" }}>
            Historical PlaceDash AI picks saved before race start.
          </p>
        </div>

        <section
          style={{
            padding: "24px",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "22px",
            background: "rgba(2,8,18,0.55)",
            backdropFilter: "blur(14px)",
          }}
        >
          {loading ? (
            <p style={{ color: "#94a3b8" }}>Loading saved AI picks...</p>
          ) : picks.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>
              No saved AI picks yet. Picks will appear here after qualifying
              races are saved before race start.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {picks.map((r, i) => {
                const isFreePick = i === 0;

                return (
                  <div
                    key={r.id || i}
                    style={{
                      padding: "16px",
                      borderRadius: "16px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: "17px" }}>
                      {r.course} Race {r.race_number || r.raceNumber}
                      {r.state ? ` (${r.state})` : ""} ·{" "}
                      {r.off_time || r.raceTime || "TBA"}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "18px",
                        marginTop: "8px",
                      }}
                    >
                      <span>
                        AI Pick:{" "}
                        {isFreePick
                          ? `${r.horse_number || r.horseNumber}. ${
                              r.horse_name || r.horseName
                            }`
                          : "🔒 Upgrade to reveal pick"}
                      </span>

                      <span style={{ color: "#facc15", fontWeight: 800 }}>
                        {r.confidence || "PENDING"}
                      </span>
                    </div>

                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: "12px",
                        marginTop: "8px",
                      }}
                    >
                      Date: {r.pick_date || r.date || "Unknown"} · Result:{" "}
                      {r.result_status || r.result || "Pending"} · Score:{" "}
                      {r.score || 0}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
