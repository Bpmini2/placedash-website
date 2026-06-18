"use client";

import React, { useEffect, useMemo, useState } from "react";

type FavouriteSplitPick = {
  id: string;
  race_date: string;
  course: string;
  race_number: number;
  race_time?: string;
  state?: string;
  favourite_horse: string;
  horse_number?: string;
  win_odds?: number;
  place_odds?: number;
  bank_before_bet?: number;
  total_stake?: number;
  win_stake?: number;
  place_stake?: number;
  finish_position?: number | null;
  status?: string;
  win_return?: number;
  place_return?: number;
  total_return?: number;
  profit_loss?: number;
  bank_after_bet?: number;
  strategy_version?: string;
  race_card_json?: any;
};

type Summary = {
  startingBank: number;
  currentBank: number;
  totalBets: number;
  completedBets: number;
  pendingBets: number;
  wins: number;
  places: number;
  winStrikeRate: number;
  placeStrikeRate: number;
  totalProfitLoss: number;
  roi: number;
  averageWinOdds: number;
  averagePlaceOdds: number;
};

function money(value: any) {
  const numberValue = Number(value) || 0;

  return numberValue.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function numberFormat(value: any, decimals = 2) {
  const numberValue = Number(value) || 0;
  return numberValue.toFixed(decimals);
}

function getStatusColour(status?: string) {
  if (status === "won") return "#22c55e";
  if (status === "placed") return "#38bdf8";
  if (status === "unplaced") return "#ef4444";
  if (status === "scratched") return "#f97316";
  if (status === "abandoned") return "#f97316";
  if (status === "pending") return "#facc15";
  return "#94a3b8";
}

function getStatusBackground(status?: string) {
  if (status === "won") return "rgba(34,197,94,0.15)";
  if (status === "placed") return "rgba(56,189,248,0.15)";
  if (status === "unplaced") return "rgba(239,68,68,0.15)";
  if (status === "scratched") return "rgba(249,115,22,0.15)";
  if (status === "abandoned") return "rgba(249,115,22,0.15)";
  if (status === "pending") return "rgba(250,204,21,0.15)";
  return "rgba(148,163,184,0.15)";
}

function getStatusBorder(status?: string) {
  if (status === "won") return "rgba(34,197,94,0.35)";
  if (status === "placed") return "rgba(56,189,248,0.35)";
  if (status === "unplaced") return "rgba(239,68,68,0.35)";
  if (status === "scratched") return "rgba(249,115,22,0.35)";
  if (status === "abandoned") return "rgba(249,115,22,0.35)";
  if (status === "pending") return "rgba(250,204,21,0.35)";
  return "rgba(148,163,184,0.35)";
}

function getStatusLabel(status?: string) {
  if (status === "won") return "WON";
  if (status === "placed") return "PLACED";
  if (status === "unplaced") return "UNPLACED";
  if (status === "scratched") return "SCRATCHED";
  if (status === "abandoned") return "ABANDONED";
  if (status === "pending") return "PENDING";
  return "UNKNOWN";
}

function formatDate(dateString?: string) {
  if (!dateString) return "Date TBA";

  const parsed = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) return dateString;

  return parsed.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRaceTime(rawTime?: string, state?: string) {
  if (!rawTime) {
    return {
      melbourneTime: "Time TBA",
      localTime: "Time TBA",
    };
  }

  const localTrackTimeZone =
    state === "WA"
      ? "Australia/Perth"
      : state === "SA" || state === "NT"
      ? "Australia/Adelaide"
      : state === "QLD"
      ? "Australia/Brisbane"
      : state === "TAS"
      ? "Australia/Hobart"
      : state === "NSW" || state === "ACT"
      ? "Australia/Sydney"
      : "Australia/Melbourne";

  const parsed = new Date(rawTime);

  if (!Number.isNaN(parsed.getTime())) {
    return {
      melbourneTime: parsed.toLocaleTimeString("en-AU", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Australia/Melbourne",
      }),
      localTime: parsed.toLocaleTimeString("en-AU", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: localTrackTimeZone,
      }),
    };
  }

  return {
    melbourneTime: rawTime,
    localTime: rawTime,
  };
}

export default function FavouriteSplitTrackRecordPage() {
  const [picks, setPicks] = useState<FavouriteSplitPick[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPick, setSelectedPick] = useState<FavouriteSplitPick | null>(
    null
  );
  const [editingPickId, setEditingPickId] = useState<string | null>(null);
  const [savingResultId, setSavingResultId] = useState<string | null>(null);
  const [editResult, setEditResult] = useState({
    status: "pending",
    finish_position: "",
    win_odds: "",
    place_odds: "",
  });
  const [dateMode, setDateMode] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setIsAdmin(searchParams.get("admin") === "true");

    async function loadFavouriteSplitPicks() {
      try {
        const res = await fetch("/api/favourite-split-picks", {
          cache: "no-store",
        });
        const data = await res.json();

        if (data.ok) {
          setPicks(data.picks || []);
          setSummary(data.summary || null);
        }
      } catch (error) {
        console.error("Failed loading favourite split picks", error);
      } finally {
        setLoading(false);
      }
    }

    loadFavouriteSplitPicks();
  }, []);

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Australia/Melbourne",
  });

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toLocaleDateString("en-CA", {
    timeZone: "Australia/Melbourne",
  });

  const availableTracks = useMemo(() => {
    return Array.from(new Set(picks.map((pick) => pick.course))).filter(Boolean);
  }, [picks]);

  const filteredPicks = useMemo(() => {
    return picks.filter((pick) => {
      const pickDate = pick.race_date;

      if (dateMode === "today" && pickDate !== today) return false;
      if (dateMode === "yesterday" && pickDate !== yesterday) return false;

      if (dateMode === "last7") {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const pickDateObj = new Date(`${pickDate}T12:00:00`);
        if (pickDateObj < cutoff) return false;
      }

      if (dateMode === "last30") {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const pickDateObj = new Date(`${pickDate}T12:00:00`);
        if (pickDateObj < cutoff) return false;
      }

      if (dateMode === "custom" && selectedDate && pickDate !== selectedDate) {
        return false;
      }

      if (trackFilter !== "all" && pick.course !== trackFilter) return false;

      return true;
    });
  }, [picks, dateMode, selectedDate, trackFilter, today, yesterday]);

  const currentFilterTitle =
    dateMode === "today"
      ? "Today"
      : dateMode === "yesterday"
      ? "Yesterday"
      : dateMode === "last7"
      ? "Last 7 Days"
      : dateMode === "last30"
      ? "Last 30 Days"
      : dateMode === "custom"
      ? selectedDate || "Custom Date"
      : "All Favourite Split Picks";

  function downloadCsv() {
    const headers = [
      "Date",
      "Course",
      "Race",
      "Favourite Horse",
      "Horse Number",
      "Win Odds",
      "Place Odds",
      "Total Stake",
      "Win Stake",
      "Place Stake",
      "Finish Position",
      "Win Return",
      "Place Return",
      "Total Return",
      "Profit/Loss",
      "Bank After Bet",
      "Status",
    ];

    const rows = filteredPicks.map((pick) => [
      pick.race_date,
      pick.course,
      pick.race_number,
      pick.favourite_horse,
      pick.horse_number || "",
      pick.win_odds || "",
      pick.place_odds || "",
      pick.total_stake || "",
      pick.win_stake || "",
      pick.place_stake || "",
      pick.finish_position || "",
      pick.win_return || "",
      pick.place_return || "",
      pick.total_return || "",
      pick.profit_loss || "",
      pick.bank_after_bet || "",
      pick.status || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "placedash-favourite-split-track-record.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  async function refreshFavouriteSplitPicks() {
    const res = await fetch("/api/favourite-split-picks", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.ok) {
      setPicks(data.picks || []);
      setSummary(data.summary || null);
    }
  }

  function startEditingPick(pick: FavouriteSplitPick) {
    setEditingPickId(pick.id);
    setEditResult({
      status: pick.status || "pending",
      finish_position:
        pick.finish_position === null || pick.finish_position === undefined
          ? ""
          : String(pick.finish_position),
      win_odds:
        pick.win_odds === null || pick.win_odds === undefined
          ? ""
          : String(pick.win_odds),
      place_odds:
        pick.place_odds === null || pick.place_odds === undefined
          ? ""
          : String(pick.place_odds),
    });
  }

  async function updateFavouriteSplitResult(pick: FavouriteSplitPick) {
    try {
      setSavingResultId(pick.id);

      const res = await fetch("/api/favourite-split-picks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: pick.id,
          status: editResult.status,
          finish_position: editResult.finish_position,
          win_odds: editResult.win_odds,
          place_odds: editResult.place_odds,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        alert(`Update failed: ${data.error || "Unknown error"}`);
        return;
      }

      await refreshFavouriteSplitPicks();
      setEditingPickId(null);
      alert("Favourite Split result updated.");
    } catch (error) {
      console.error("Favourite Split update failed", error);
      alert("Favourite Split update failed. Check console/logs.");
    } finally {
      setSavingResultId(null);
    }
  }

  if (!isAdmin) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "48px",
          backgroundImage:
            'linear-gradient(rgba(2,8,18,0.88), rgba(2,8,18,0.94)), url("/racehorse-bg.png")',
          backgroundSize: "cover",
          backgroundPosition: "center top",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            maxWidth: "760px",
            margin: "120px auto",
            padding: "32px",
            borderRadius: "24px",
            background: "rgba(15,23,42,0.72)",
            border: "1px solid rgba(255,255,255,0.14)",
            textAlign: "center",
          }}
        >
          <h1>Admin Only</h1>
          <p style={{ color: "#b7c5d8", lineHeight: 1.6 }}>
            This Favourite Split Track Record is an admin-only testing page.
          </p>
          <a
            href="/dashboard"
            style={{
              display: "inline-block",
              marginTop: "20px",
              padding: "14px 24px",
              borderRadius: "12px",
              background: "#38bdf8",
              color: "#07111f",
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            Back to Dashboard
          </a>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 48px",
        backgroundImage:
          'linear-gradient(rgba(2,8,18,0.86), rgba(2,8,18,0.92)), url("/racehorse-bg.png")',
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
        color: "#ffffff",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <header
          style={{
            width: "100%",
            marginBottom: "42px",
            background: "#f3f4f6",
            border: "1px solid rgba(255,255,255,0.95)",
            borderRadius: "26px",
            padding: "20px 34px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "22px",
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
                boxShadow: "0 10px 25px rgba(56,189,248,0.35)",
              }}
            >
              123
            </div>

            <span
              style={{
                fontSize: "42px",
                fontWeight: 900,
                color: "#07111f",
                lineHeight: 1,
              }}
            >
              PlaceDash
            </span>
          </div>

          <nav style={{ display: "flex", gap: "28px", alignItems: "center" }}>
            <a
              href="/dashboard"
              style={{
                color: "#07111f",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Dashboard
            </a>

            <a
              href="/track-record?admin=true"
              style={{
                color: "#07111f",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              v2 Track Record
            </a>

            <a
              href="/track-record-favourite-split?admin=true"
              style={{
                color: "#0284c7",
                fontWeight: 900,
                textDecoration: "none",
              }}
            >
              Favourite Split
            </a>
          </nav>
        </header>

        <section style={{ marginBottom: "26px" }}>
          <div
            style={{
              display: "inline-block",
              marginBottom: "14px",
              padding: "7px 14px",
              borderRadius: "999px",
              background: "rgba(56,189,248,0.14)",
              color: "#38bdf8",
              fontSize: "13px",
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Admin Testing · v3_favourite_split
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
            Favourite Split Track Record
          </h1>

          <p style={{ color: "#b7c5d8", fontSize: "17px", marginTop: "12px" }}>
            Admin-only test record for favourite-based win/place split staking.
            This does not affect the official v2 PlaceDash Track Record.
          </p>

          <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "14px" }}>
            Strategy: Total stake = 10% of bank. Win stake = 25%. Place stake =
            75%.
          </p>

          <p
            style={{
              color: "#94a3b8",
              fontSize: "12px",
              marginTop: "6px",
              lineHeight: 1.5,
            }}
          >
            Gamble responsibly. PlaceDash provides racing analysis and
            information only — it is not betting advice and does not guarantee
            results.
          </p>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            marginBottom: "28px",
          }}
        >
          {[
            {
              label: "Starting Bank",
              value: money(summary?.startingBank || 1000),
              color: "#38bdf8",
            },
            {
              label: "Current Bank",
              value: money(summary?.currentBank || 1000),
              color: "#22c55e",
            },
            {
              label: "Total Bets",
              value: summary?.totalBets || 0,
              color: "#38bdf8",
            },
            {
              label: "Win Strike Rate",
              value: `${summary?.winStrikeRate || 0}%`,
              color: "#facc15",
            },
            {
              label: "Place Strike Rate",
              value: `${summary?.placeStrikeRate || 0}%`,
              color: "#facc15",
            },
            {
              label: "Profit / Loss",
              value: money(summary?.totalProfitLoss || 0),
              color:
                Number(summary?.totalProfitLoss || 0) >= 0
                  ? "#22c55e"
                  : "#ef4444",
            },
            {
              label: "ROI",
              value: `${summary?.roi || 0}%`,
              color: Number(summary?.roi || 0) >= 0 ? "#22c55e" : "#ef4444",
            },
            {
              label: "Avg Win Odds",
              value: numberFormat(summary?.averageWinOdds || 0),
              color: "#38bdf8",
            },
            {
              label: "Avg Place Odds",
              value: numberFormat(summary?.averagePlaceOdds || 0),
              color: "#38bdf8",
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                padding: "26px",
                borderRadius: "22px",
                background: "rgba(15,23,42,0.72)",
                border: "1px solid rgba(255,255,255,0.13)",
                boxShadow: "0 18px 45px rgba(0,0,0,0.24)",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  marginTop: "16px",
                  color: card.color,
                  fontSize: "36px",
                  fontWeight: 900,
                }}
              >
                {card.value}
              </div>
            </div>
          ))}
        </div>

        <section
          style={{
            padding: "24px",
            borderRadius: "22px",
            background: "rgba(2,8,18,0.72)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 18px 45px rgba(0,0,0,0.24)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "14px",
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#38bdf8",
                fontSize: "22px",
              }}
            >
              Filtered Results: {currentFilterTitle} ({filteredPicks.length})
            </h2>

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
                  setDateMode("today");
                  setSelectedDate(today);
                }}
                style={filterButtonStyle(dateMode === "today")}
              >
                Today
              </button>

              <button
                onClick={() => {
                  setDateMode("yesterday");
                  setSelectedDate(yesterday);
                }}
                style={filterButtonStyle(dateMode === "yesterday")}
              >
                Yesterday
              </button>

              <button
                onClick={() => setDateMode("last7")}
                style={filterButtonStyle(dateMode === "last7")}
              >
                Last 7 Days
              </button>

              <button
                onClick={() => setDateMode("last30")}
                style={filterButtonStyle(dateMode === "last30")}
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
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(15,23,42,0.9)",
                  color: "#ffffff",
                  fontWeight: 700,
                }}
              />

              <select
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(15,23,42,0.9)",
                  color: "#ffffff",
                  fontWeight: 700,
                }}
              >
                <option value="all">All Tracks</option>
                {availableTracks.map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>

              <button
                onClick={downloadCsv}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(56,189,248,0.45)",
                  background: "rgba(56,189,248,0.12)",
                  color: "#38bdf8",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Download CSV
              </button>
            </div>
          </div>

          {loading && (
            <div style={{ color: "#94a3b8", padding: "22px" }}>
              Loading favourite split track record...
            </div>
          )}

          {!loading && filteredPicks.length === 0 && (
            <div style={{ color: "#94a3b8", padding: "22px" }}>
              No favourite split picks found for this date/filter.
            </div>
          )}

          {!loading && filteredPicks.length > 0 && (
            <div style={{ display: "grid", gap: "16px" }}>
              {filteredPicks.map((pick) => {
                const raceTimes = formatRaceTime(pick.race_time, pick.state);
                const isEditing = editingPickId === pick.id;
                const profitLoss = Number(pick.profit_loss || 0);

                return (
                  <div
                    key={pick.id}
                    style={{
                      padding: "20px",
                      borderRadius: "18px",
                      background: "rgba(15,23,42,0.72)",
                      border: `1px solid ${getStatusBorder(pick.status)}`,
                      boxShadow: "0 18px 45px rgba(0,0,0,0.24)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "16px",
                        flexWrap: "wrap",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ minWidth: "280px", flex: "1 1 420px" }}>
                        <h3
                          style={{
                            margin: "0 0 8px 0",
                            color: "#ffffff",
                            fontSize: "21px",
                          }}
                        >
                          {pick.course} Race {pick.race_number}
                          {pick.state ? ` (${pick.state})` : ""}
                        </h3>

                        <div
                          style={{
                            color: "#94a3b8",
                            fontSize: "14px",
                            lineHeight: 1.55,
                          }}
                        >
                          <div>Date: {formatDate(pick.race_date)}</div>
                          <div>Melbourne Time: {raceTimes.melbourneTime}</div>
                          <div>Local Track Time: {raceTimes.localTime}</div>
                        </div>

                        <p
                          style={{
                            margin: "12px 0 0 0",
                            color: "#ffffff",
                            fontSize: "16px",
                          }}
                        >
                          Favourite:{" "}
                          <strong>
                            {pick.horse_number ? `${pick.horse_number}. ` : ""}
                            {pick.favourite_horse}
                          </strong>
                        </p>

                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                            marginTop: "14px",
                          }}
                        >
                          <button
                            onClick={() => {
                              if (isEditing) {
                                setEditingPickId(null);
                              } else {
                                startEditingPick(pick);
                              }
                            }}
                            style={{
                              padding: "9px 14px",
                              borderRadius: "10px",
                              border: isEditing
                                ? "1px solid rgba(250,204,21,0.45)"
                                : "1px solid rgba(56,189,248,0.35)",
                              background: isEditing
                                ? "rgba(250,204,21,0.12)"
                                : "rgba(56,189,248,0.12)",
                              color: isEditing ? "#facc15" : "#38bdf8",
                              fontWeight: 900,
                              cursor: "pointer",
                            }}
                          >
                            {isEditing ? "Close Editor" : "Edit"}
                          </button>

                          <button
                            onClick={() => setSelectedPick(pick)}
                            style={{
                              padding: "9px 14px",
                              borderRadius: "10px",
                              border: "1px solid rgba(56,189,248,0.35)",
                              background: "rgba(56,189,248,0.12)",
                              color: "#38bdf8",
                              fontWeight: 900,
                              cursor: "pointer",
                            }}
                          >
                            View Race Card
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(120px, 1fr))",
                          gap: "12px",
                          flex: "1 1 520px",
                        }}
                      >
                        <MiniStat label="Win Odds" value={numberFormat(pick.win_odds || 0)} />
                        <MiniStat
                          label="Place Odds"
                          value={numberFormat(pick.place_odds || 0)}
                        />
                        <MiniStat label="Total Stake" value={money(pick.total_stake)} />
                        <MiniStat label="Win Stake" value={money(pick.win_stake)} />
                        <MiniStat label="Place Stake" value={money(pick.place_stake)} />
                        <MiniStat
                          label="Finish"
                          value={pick.finish_position || "Pending"}
                        />
                        <MiniStat label="Win Return" value={money(pick.win_return)} />
                        <MiniStat
                          label="Place Return"
                          value={money(pick.place_return)}
                        />
                        <MiniStat
                          label="Profit / Loss"
                          value={money(pick.profit_loss)}
                          valueColor={profitLoss >= 0 ? "#22c55e" : "#ef4444"}
                        />
                        <MiniStat label="Bank After" value={money(pick.bank_after_bet)} />
                      </div>

                      <div
                        style={{
                          padding: "8px 12px",
                          borderRadius: "999px",
                          background: getStatusBackground(pick.status),
                          border: `1px solid ${getStatusBorder(pick.status)}`,
                          color: getStatusColour(pick.status),
                          fontWeight: 900,
                          fontSize: "13px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {getStatusLabel(pick.status)}
                      </div>
                    </div>

                    {isEditing && (
                      <div
                        style={{
                          marginTop: "18px",
                          padding: "18px",
                          borderRadius: "16px",
                          border: "1px solid rgba(56,189,248,0.28)",
                          background: "rgba(2,8,18,0.52)",
                        }}
                      >
                        <div
                          style={{
                            marginBottom: "12px",
                            color: "#38bdf8",
                            fontWeight: 900,
                            fontSize: "15px",
                          }}
                        >
                          Manual Result Update — {pick.course} Race{" "}
                          {pick.race_number}:{" "}
                          {pick.horse_number ? `${pick.horse_number}. ` : ""}
                          {pick.favourite_horse}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "10px",
                            alignItems: "center",
                          }}
                        >
                          <select
                            value={editResult.status}
                            onChange={(e) =>
                              setEditResult((prev) => ({
                                ...prev,
                                status: e.target.value,
                              }))
                            }
                            style={{
                              ...adminInputStyle,
                              minWidth: "150px",
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="won">Won</option>
                            <option value="placed">Placed</option>
                            <option value="unplaced">Unplaced</option>
                            <option value="scratched">Scratched</option>
                            <option value="abandoned">Abandoned</option>
                          </select>

                          <input
                            type="number"
                            placeholder="Finish"
                            value={editResult.finish_position}
                            onChange={(e) =>
                              setEditResult((prev) => ({
                                ...prev,
                                finish_position: e.target.value,
                              }))
                            }
                            style={{
                              ...adminInputStyle,
                              minWidth: "110px",
                            }}
                          />

                          <input
                            type="number"
                            step="0.01"
                            placeholder="Win Odds"
                            value={editResult.win_odds}
                            onChange={(e) =>
                              setEditResult((prev) => ({
                                ...prev,
                                win_odds: e.target.value,
                              }))
                            }
                            style={{
                              ...adminInputStyle,
                              minWidth: "120px",
                            }}
                          />

                          <input
                            type="number"
                            step="0.01"
                            placeholder="Place Odds"
                            value={editResult.place_odds}
                            onChange={(e) =>
                              setEditResult((prev) => ({
                                ...prev,
                                place_odds: e.target.value,
                              }))
                            }
                            style={{
                              ...adminInputStyle,
                              minWidth: "130px",
                            }}
                          />

                          <button
                            onClick={() => updateFavouriteSplitResult(pick)}
                            disabled={savingResultId === pick.id}
                            style={{
                              padding: "10px 16px",
                              borderRadius: "10px",
                              border: "1px solid rgba(34,197,94,0.45)",
                              background: "rgba(34,197,94,0.15)",
                              color: "#22c55e",
                              fontWeight: 900,
                              cursor: "pointer",
                            }}
                          >
                            {savingResultId === pick.id
                              ? "Updating..."
                              : "Update Result"}
                          </button>

                          <button
                            onClick={() => setEditingPickId(null)}
                            style={{
                              padding: "10px 16px",
                              borderRadius: "10px",
                              border: "1px solid rgba(255,255,255,0.16)",
                              background: "rgba(255,255,255,0.06)",
                              color: "#ffffff",
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {selectedPick && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.68)",
              zIndex: 9998,
              padding: "32px",
              overflow: "auto",
            }}
          >
            <div
              style={{
                width: "min(1100px, 94vw)",
                margin: "0 auto",
                padding: "24px",
                border: "1px solid rgba(56,189,248,0.35)",
                borderRadius: "18px",
                background: "rgba(2,8,18,0.98)",
                boxShadow: "0 30px 90px rgba(0,0,0,0.75)",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                {selectedPick.course} Race {selectedPick.race_number}
                {selectedPick.state ? ` (${selectedPick.state})` : ""}
              </h2>

              <p style={{ color: "#94a3b8" }}>
                Favourite:{" "}
                <strong style={{ color: "#ffffff" }}>
                  {selectedPick.horse_number
                    ? `${selectedPick.horse_number}. `
                    : ""}
                  {selectedPick.favourite_horse}
                </strong>
              </p>

              <p style={{ color: "#94a3b8" }}>
                Strategy: 10% total stake · 25% win · 75% place
              </p>

              <button
                onClick={() => setSelectedPick(null)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#ffffff",
                  cursor: "pointer",
                  marginBottom: "18px",
                }}
              >
                Close
              </button>

              {Array.isArray(selectedPick.race_card_json) &&
              selectedPick.race_card_json.length > 0 ? (
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
                        <th style={thStyle}>No.</th>
                        <th style={thStyle}>Horse</th>
                        <th style={thStyle}>Win Odds</th>
                        <th style={thStyle}>Place Odds</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedPick.race_card_json.map(
                        (runner: any, index: number) => (
                          <tr
                            key={`${runner.number || index}-${
                              runner.horse || runner.name
                            }`}
                            style={{
                              borderTop: "1px solid rgba(255,255,255,0.08)",
                              color: "#cbd5e1",
                            }}
                          >
                            <td style={tdStyle}>
                              {runner.number ||
                                runner.runner_number ||
                                runner.runnerNumber ||
                                "-"}
                            </td>
                            <td style={tdStyle}>
                              {runner.horse || runner.name || "-"}
                            </td>
                            <td style={tdStyle}>
                              {runner.sportsbet_win ||
                                runner.win_odds ||
                                runner.odds?.sportsbetWin ||
                                "-"}
                            </td>
                            <td style={tdStyle}>
                              {runner.sportsbet_place ||
                                runner.place_odds ||
                                runner.odds?.sportsbetPlace ||
                                "-"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: "#94a3b8" }}>
                  No race card snapshot saved for this pick yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function MiniStat({
  label,
  value,
  valueColor = "#ffffff",
}: {
  label: string;
  value: any;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        padding: "10px",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: "11px",
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: "6px",
          color: valueColor,
          fontSize: "14px",
          fontWeight: 900,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function filterButtonStyle(active: boolean): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: "10px",
    border: active
      ? "1px solid rgba(56,189,248,0.55)"
      : "1px solid rgba(255,255,255,0.14)",
    background: active ? "rgba(56,189,248,0.18)" : "rgba(255,255,255,0.05)",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 800,
  };
}

const thStyle: React.CSSProperties = {
  padding: "12px",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};

const adminInputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(15,23,42,0.95)",
  color: "#ffffff",
  fontWeight: 800,
  minWidth: "80px",
};
