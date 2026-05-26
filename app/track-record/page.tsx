"use client";
// Admin mode enabled for Track Record testing

import React, { useEffect, useState } from "react";

export default function TrackRecordPage() {
  const [picks, setPicks] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Australia/Melbourne",
  });

  const [selectedDate, setSelectedDate] = useState(today);
  const [dateMode, setDateMode] = useState("today");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(new URLSearchParams(window.location.search).get("admin") === "true");

    async function loadTrackRecord() {
      try {
        const statsRes = await fetch("/api/track-record-stats", {
          cache: "no-store",
        });
        const statsData = await statsRes.json();

        setSummary(statsData.summary || null);
        setPicks(statsData.last20 || []);
      } catch (err) {
        console.error("Failed to load track record", err);
      } finally {
        setLoading(false);
      }
    }

    loadTrackRecord();
  }, []);

  const filteredPicks = picks.filter((pick) => {
    const pickDate = pick.race_date || pick.pick_date || pick.date;

    if (dateMode === "today" || dateMode === "yesterday" || dateMode === "custom") {
      if (pickDate !== selectedDate) return false;
    }

    if (dateMode === "last7" || dateMode === "last30") {
      const pickTime = new Date(pickDate).getTime();
      const todayTime = new Date(today).getTime();
      const daysBack = dateMode === "last30" ? 29 : 6;
      const startDate = todayTime - daysBack * 24 * 60 * 60 * 1000;

      if (pickTime < startDate || pickTime > todayTime) return false;
    }

    if (activeFilter === "all") return true;
    if (activeFilter === "completed") return pick.result && pick.result !== "pending";
    if (activeFilter === "pending") return !pick.result || pick.result === "pending";
    if (activeFilter === "placed") return pick.placed === true;
    if (activeFilter === "unplaced") return pick.placed === false;
    if (activeFilter === "scratched") {
      return pick.result === "scratched" || pick.settlement_status === "void";
    }
    if (activeFilter === "high") return pick.confidence === "HIGH";

    return true;
  });

  const filterTitles: any = {
    all: "All AI Picks",
    completed: "Completed Picks",
    pending: "Pending Picks",
    placed: "Placed Picks",
    unplaced: "Unplaced Picks",
    scratched: "Scratched / Void Picks",
    high: "High Confidence Picks",
  };

  const currentFilterTitle = filterTitles[activeFilter] || "All AI Picks";

  function downloadCSV() {
    const headers = [
      "Date",
      "Track",
      "Race Number",
      "Race Time",
      "Horse Number",
      "Horse Name",
      "Confidence",
      "AI Score",
      "Result",
      "Placed Status",
      "Place Dividend",
      "Bet Size",
      "Return Amount",
      "Profit Loss",
      "Bank Before Bet",
      "Bank After Bet",
    ];

    const rows = filteredPicks.map((r: any) => [
      r.race_date || "",
      r.course || "",
      r.race_number || "",
      r.race_time || "",
      r.horse_number || "",
      r.horse_name || "",
      r.confidence || "",
      r.ai_score || "",
      r.result || "",
      r.result === "scratched" || r.settlement_status === "void"
        ? "Void"
        : r.placed === true
        ? "Placed"
        : r.placed === false
        ? "Unplaced"
        : "Pending",
      r.place_dividend || r.dividend || "",
      r.bet_size || "",
      r.return_amount || "",
      r.profit_loss || "",
      r.bank_before_bet || "",
      r.bank_after_bet || r.running_bank || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", `placedash-track-record-${dateMode}-${selectedDate}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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
            SAVED AI PICKS
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

          <div
            style={{
              display: "inline-block",
              marginTop: "10px",
              marginBottom: "20px",
              padding: "6px 10px",
              borderRadius: "999px",
              background: "rgba(34,197,94,0.12)",
              color: "#22c55e",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            Last Updated:{" "}
            {new Date().toLocaleString("en-AU", {
              timeZone: "Australia/Melbourne",
            })}
          </div>
        </div>

        {summary && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "18px",
              marginBottom: "28px",
            }}
          >
            {[
              { label: "Total AI Picks", value: summary.totalPicks, color: "#22c55e", filter: "all" },
              { label: "Completed", value: summary.completedPicks, color: "#38bdf8", filter: "completed" },
              { label: "Pending", value: summary.pendingPicks, color: "#facc15", filter: "pending" },
              { label: "Placed", value: summary.placedPicks, color: "#22c55e", filter: "placed" },
              { label: "Unplaced", value: summary.unplacedPicks, color: "#ef4444", filter: "unplaced" },
              {
                label: "Place Strike Rate",
                value: `${summary.strikeRate}% (${summary.placedPicks}/${summary.completedPicks})`,
                color: "#facc15",
                filter: "placed",
              },
              { label: "ROI", value: `${summary.roi}%`, color: summary.roi >= 0 ? "#22c55e" : "#ef4444" },
              {
                label: "Profit / Loss",
                value: `$${summary.totalProfitLoss}`,
                color: summary.totalProfitLoss >= 0 ? "#22c55e" : "#ef4444",
              },
              {
                label: "Current Bank",
                value: `$${summary.currentBank || 1000}`,
                color: "#22c55e",
              },
            ].map((card, index) => (
              <div
                key={index}
                onClick={() => setActiveFilter(card.filter || "all")}
                style={{
                  cursor: "pointer",
                  padding: "22px",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.05)",
                  border:
                    activeFilter === card.filter
                      ? "1px solid rgba(34,197,94,0.55)"
                      : "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                  boxShadow:
                    activeFilter === card.filter
                      ? "0 0 22px rgba(34,197,94,0.22)"
                      : "none",
                }}
              >
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "13px",
                    marginBottom: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 700,
                  }}
                >
                  {card.label}
                </div>

                <div
                  style={{
                    fontSize: "34px",
                    fontWeight: 900,
                    color: card.color,
                  }}
                >
                  {card.value}
                </div>
              </div>
            ))}
          </div>
        )}

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
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              <div
                style={{
                  color: "#22c55e",
                  fontSize: "18px",
                  fontWeight: 700,
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>Showing: {currentFilterTitle}</div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => {
                        setSelectedDate(today);
                        setDateMode("today");
                      }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: dateMode === "today" ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.05)",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Today
                    </button>

                    <button
                      onClick={() => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        setSelectedDate(
                          yesterday.toLocaleDateString("en-CA", {
                            timeZone: "Australia/Melbourne",
                          })
                        );
                        setDateMode("yesterday");
                      }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: dateMode === "yesterday" ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.05)",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Yesterday
                    </button>

                    <button
                      onClick={() => setDateMode("last7")}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: dateMode === "last7" ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.05)",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Last 7 Days
                    </button>

                    <button
                      onClick={() => setDateMode("last30")}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: dateMode === "last30" ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.05)",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Last 30 Days
                    </button>

                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setDateMode("custom");
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.05)",
                        color: "#fff",
                      }}
                    />

                    <select
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.05)",
                        color: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      <option value="all" style={{ color: "#07111f" }}>All</option>
                      <option value="placed" style={{ color: "#07111f" }}>Placed</option>
                      <option value="unplaced" style={{ color: "#07111f" }}>Unplaced</option>
                      <option value="pending" style={{ color: "#07111f" }}>Pending</option>
                      <option value="completed" style={{ color: "#07111f" }}>Completed</option>
                      <option value="scratched" style={{ color: "#07111f" }}>Scratched/Void</option>
                      <option value="high" style={{ color: "#07111f" }}>High Confidence</option>
                    </select>

                    <button
                      onClick={downloadCSV}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        border: "1px solid rgba(34,197,94,0.35)",
                        background: "rgba(34,197,94,0.12)",
                        color: "#22c55e",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Download CSV
                    </button>
                  </div>
                </div>
              </div>

              {filteredPicks.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>No picks found for this date/filter.</p>
              ) : (
                filteredPicks.map((r, i) => {
                  const canRevealPick = isAdmin || i === 0;

                  return (
                    <div
                      key={r.id || i}
                      style={{
                        padding: "16px",
                        borderRadius: "16px",
                        border:
                          r.placed === true
                            ? "1px solid rgba(34,197,94,0.35)"
                            : r.placed === false
                            ? "1px solid rgba(239,68,68,0.30)"
                            : "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: "17px" }}>
                        {r.course} Race {r.race_number || r.raceNumber}
                        {r.state ? ` (${r.state})` : ""} ·{" "}
                        {r.race_time || r.off_time || r.raceTime || "TBA"}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", marginTop: "8px" }}>
                        <span>
                          AI Pick: {`${r.horse_number || r.horseNumber}. ${r.horse_name || r.horseName}`}
                        </span>

                        <span
                          style={{
                            color:
                              r.confidence === "HIGH"
                                ? "#22c55e"
                                : r.confidence === "MEDIUM"
                                ? "#facc15"
                                : "#ef4444",
                            fontWeight: 800,
                          }}
                        >
                          {r.confidence || "PENDING"}
                        </span>
                      </div>

                      {canRevealPick && (
                        <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "10px", lineHeight: "1.5" }}>
                          <strong style={{ color: "#cbd5e1" }}>Reason:</strong>{" "}
                          {r.reasoning || "AI analysis pending"}
                        </div>
                      )}

                      <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "8px" }}>
                        Date: {r.race_date || r.pick_date || r.date || "Unknown"} ·{" "}
                        <span
                          style={{
                            color:
                              r.result === "scratched" || r.settlement_status === "void"
                                ? "#94a3b8"
                                : r.placed === true
                                ? "#22c55e"
                                : r.placed === false
                                ? "#ef4444"
                                : "#94a3b8",
                            fontWeight: 700,
                          }}
                        >
                          {r.result === "scratched" || r.settlement_status === "void"
                            ? "⚪ SCRATCHED · VOID / NO BET"
                            : r.placed === true
                            ? `🟢 PLACED (${r.result || "?"})`
                            : r.placed === false
                            ? `🔴 UNPLACED (${r.result || "?"})`
                            : "🟡 PENDING"}
                        </span>

                        {r.placed === true && (r.place_dividend || r.dividend) && (
                          <span style={{ marginLeft: "10px", color: "#22c55e", fontWeight: 800 }}>
                            Place Price: ${r.place_dividend || r.dividend}
                          </span>
                        )}

                        <button
                          onClick={(e) => {
                            const container = e.currentTarget.parentElement?.parentElement;
                            const editBox = container?.querySelector(".edit-result-box") as HTMLDivElement;

                            if (editBox) {
                              editBox.style.display =
                                editBox.style.display === "none" ? "flex" : "none";
                            }
                          }}
                          style={{
                            marginLeft: "10px",
                            padding: "5px 10px",
                            borderRadius: "8px",
                            border: "1px solid rgba(34,197,94,0.35)",
                            background: "rgba(34,197,94,0.12)",
                            color: "#22c55e",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                      </div>

                      <div
                        className="edit-result-box"
                        style={{
                          display: "none",
                          marginTop: "10px",
                          gap: "10px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <select
                          defaultValue={
                            r.result === "scratched" || r.settlement_status === "void"
                              ? "Scratched/Void"
                              : r.placed === true
                              ? "Placed"
                              : r.placed === false
                              ? "Unplaced"
                              : "Placed"
                          }
                          style={{
                            padding: "8px 10px",
                            borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.05)",
                            color: "#fff",
                          }}
                        >
                          <option value="Placed" style={{ color: "#07111f" }}>Placed</option>
                          <option value="Unplaced" style={{ color: "#07111f" }}>Unplaced</option>
                          <option value="Scratched/Void" style={{ color: "#07111f" }}>Scratched/Void</option>
                        </select>

                        <input
                          type="number"
                          step="0.01"
                          placeholder="Place Dividend"
                          defaultValue={r.place_dividend || r.dividend || ""}
                          style={{
                            padding: "8px 10px",
                            borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.05)",
                            color: "#fff",
                            width: "160px",
                          }}
                        />

                        <button
                          onClick={async (e) => {
                            const container = e.currentTarget.parentElement;

                            const input = container?.querySelector("input") as HTMLInputElement;
                            const select = container?.querySelector("select") as HTMLSelectElement;

                            const selectedResult = select?.value || "Placed";
                            const placeDividend = input?.value;

                            if (selectedResult === "Placed" && !placeDividend) {
                              alert("Please enter a place dividend.");
                              return;
                            }

                            const res = await fetch("/api/save-dividend", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                id: r.id,
                                result: selectedResult,
                                place_dividend:
                                  selectedResult === "Placed" ? placeDividend : null,
                              }),
                            });

                            const data = await res.json();

                            if (!data.ok) {
                              alert(data.error || "Failed to update result.");
                              return;
                            }

                            alert("Result updated.");
                            window.location.reload();
                          }}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: "none",
                            background: "#22c55e",
                            color: "#07111f",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          Update Result
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
