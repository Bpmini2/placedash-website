"use client";

import React, { useMemo, useState } from "react";

type ResultType = "Pending" | "Win" | "Loss" | "Void" | "Race Abandoned";

type BetRow = {
  betNumber: number;
  actualBet: string;
  dividend: string;
  result: ResultType;
};

export default function BankrollCalculatorPage() {
  const [startingBalance, setStartingBalance] = useState("1000");

  const [rows, setRows] = useState<BetRow[]>(
    Array.from({ length: 20 }, (_, index) => ({
      betNumber: index + 1,
      actualBet: "",
      dividend: "",
      result: "Pending",
    }))
  );

  const calculatedRows = useMemo(() => {
    let balance = Number(startingBalance) || 0;

    return rows.map((row) => {
      const openingBalance = balance;
      const recommendedBet = openingBalance * 0.1;

      const actualBetAmount =
        Number(row.actualBet) > 0 ? Number(row.actualBet) : recommendedBet;

      const dividendAmount = Number(row.dividend) || 0;

      let returnAmount = 0;
      let profitLoss = 0;
      let closingBalance = openingBalance;

      if (row.result === "Win" && dividendAmount > 0) {
        returnAmount = actualBetAmount * dividendAmount;
        profitLoss = returnAmount - actualBetAmount;
        closingBalance = openingBalance + profitLoss;
      }

      if (row.result === "Loss") {
        returnAmount = 0;
        profitLoss = -actualBetAmount;
        closingBalance = openingBalance - actualBetAmount;
      }

      if (row.result === "Void" || row.result === "Race Abandoned") {
        returnAmount = actualBetAmount;
        profitLoss = 0;
        closingBalance = openingBalance;
      }

      if (row.result === "Pending") {
        returnAmount = 0;
        profitLoss = 0;
        closingBalance = openingBalance;
      }

      if (row.result !== "Pending") {
        balance = closingBalance;
      }

      return {
        ...row,
        openingBalance,
        recommendedBet,
        actualBetAmount,
        dividendAmount,
        returnAmount,
        profitLoss,
        closingBalance,
      };
    });
  }, [rows, startingBalance]);

  const finalCompletedRow = [...calculatedRows]
    .reverse()
    .find((row) => row.result !== "Pending");

  const currentBalance = finalCompletedRow
    ? finalCompletedRow.closingBalance
    : Number(startingBalance) || 0;

  const nextBet = currentBalance * 0.1;

  function updateRow(index: number, field: keyof BetRow, value: string) {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    );
  }

  function addMoreRows() {
    setRows((currentRows) => [
      ...currentRows,
      ...Array.from({ length: 10 }, (_, index) => ({
        betNumber: currentRows.length + index + 1,
        actualBet: "",
        dividend: "",
        result: "Pending" as ResultType,
      })),
    ]);
  }

  function money(value: number) {
    return value.toLocaleString("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 48px",
        backgroundImage:
          'linear-gradient(rgba(2,8,18,0.88), rgba(2,8,18,0.94)), url("/racehorse-bg.png")',
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
        color: "#ffffff",
      }}
    >
      <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
        <header
          style={{
            marginBottom: "34px",
            background: "#f3f4f6",
            borderRadius: "26px",
            padding: "20px 34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "18px",
                background: "#38bdf8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#07111f",
                fontSize: "28px",
                fontWeight: 900,
                fontStyle: "italic",
                letterSpacing: "-3px",
              }}
            >
              123
            </div>

            <span
              style={{
                fontSize: "40px",
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
              background: "#38bdf8",
              color: "#07111f",
              padding: "14px 24px",
              borderRadius: "14px",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Back to Dashboard
          </a>
        </header>

        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "inline-block",
              marginBottom: "14px",
              padding: "7px 14px",
              borderRadius: "999px",
              background: "rgba(56,189,248,0.14)",
              color: "#38bdf8",
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Bankroll Planning Tool
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "54px",
              lineHeight: "1.05",
              letterSpacing: "-2px",
            }}
          >
            10% Stake Calculator
          </h1>

          <p
            style={{
              marginTop: "12px",
              color: "#b7c5d8",
              fontSize: "17px",
              maxWidth: "850px",
              lineHeight: 1.6,
            }}
          >
            Enter your starting balance, actual bet amount, dividend, and result.
            The calculator updates your running balance and shows the suggested
            next stake based on 10% of the current balance.
          </p>

          <p
            style={{
              marginTop: "10px",
              color: "#94a3b8",
              fontSize: "12px",
              lineHeight: 1.5,
            }}
          >
            This calculator is a bankroll planning tool only. It is not betting
            advice, financial advice, or a guarantee of profit. Gamble
            responsibly.
          </p>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            marginBottom: "26px",
          }}
        >
          <div
            style={{
              padding: "20px",
              borderRadius: "18px",
              background: "rgba(15,23,42,0.72)",
              border: "1px solid rgba(56,189,248,0.24)",
            }}
          >
            <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 800 }}>
              Starting Balance
            </div>
            <input
              type="number"
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(2,8,18,0.75)",
                color: "#ffffff",
                fontSize: "22px",
                fontWeight: 800,
              }}
            />
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: "18px",
              background: "rgba(15,23,42,0.72)",
              border: "1px solid rgba(56,189,248,0.24)",
            }}
          >
            <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 800 }}>
              Current Balance
            </div>
            <div
              style={{
                marginTop: "10px",
                color: "#22c55e",
                fontSize: "32px",
                fontWeight: 900,
              }}
            >
              {money(currentBalance)}
            </div>
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: "18px",
              background: "rgba(15,23,42,0.72)",
              border: "1px solid rgba(56,189,248,0.24)",
            }}
          >
            <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 800 }}>
              Next Suggested Bet
            </div>
            <div
              style={{
                marginTop: "10px",
                color: "#38bdf8",
                fontSize: "32px",
                fontWeight: 900,
              }}
            >
              {money(nextBet)}
            </div>
          </div>
        </section>

        <section
          style={{
            padding: "20px",
            borderRadius: "22px",
            background: "rgba(2,8,18,0.72)",
            border: "1px solid rgba(255,255,255,0.12)",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              minWidth: "980px",
            }}
          >
            <thead>
              <tr style={{ color: "#94a3b8", textAlign: "left" }}>
                <th style={{ padding: "12px" }}>Bet #</th>
                <th style={{ padding: "12px" }}>Opening Balance</th>
                <th style={{ padding: "12px" }}>10% Bet</th>
                <th style={{ padding: "12px" }}>Actual Bet</th>
                <th style={{ padding: "12px" }}>Dividend</th>
                <th style={{ padding: "12px" }}>Result</th>
                <th style={{ padding: "12px" }}>Return</th>
                <th style={{ padding: "12px" }}>Profit / Loss</th>
                <th style={{ padding: "12px" }}>Closing Balance</th>
              </tr>
            </thead>

            <tbody>
              {calculatedRows.map((row, index) => (
                <tr
                  key={row.betNumber}
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    color: "#cbd5e1",
                  }}
                >
                  <td style={{ padding: "12px", fontWeight: 800 }}>
                    {row.betNumber}
                  </td>

                  <td style={{ padding: "12px" }}>
                    {money(row.openingBalance)}
                  </td>

                  <td
                    style={{
                      padding: "12px",
                      color: "#38bdf8",
                      fontWeight: 800,
                    }}
                  >
                    {money(row.recommendedBet)}
                  </td>

                  <td style={{ padding: "12px" }}>
                    <input
                      type="number"
                      step="0.01"
                      value={row.actualBet}
                      onChange={(e) =>
                        updateRow(index, "actualBet", e.target.value)
                      }
                      onBlur={() => {
                        const value = Number(row.actualBet);
                        if (!Number.isNaN(value) && value > 0) {
                          updateRow(index, "actualBet", value.toFixed(2));
                        }
                      }}
                      placeholder={row.recommendedBet.toFixed(2)}
                      style={{
                        width: "110px",
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(15,23,42,0.9)",
                        color: "#ffffff",
                      }}
                    />
                  </td>

                  <td style={{ padding: "12px" }}>
                    <input
                      type="number"
                      step="0.01"
                      value={row.dividend}
                      onChange={(e) =>
                        updateRow(index, "dividend", e.target.value)
                      }
                      onFocus={() => {
                        if (row.dividend === "0") {
                          updateRow(index, "dividend", "");
                        }
                      }}
                      placeholder="e.g. 1.80"
                      style={{
                        width: "110px",
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(15,23,42,0.9)",
                        color: "#ffffff",
                      }}
                    />
                  </td>

                  <td style={{ padding: "12px" }}>
                    <select
                      value={row.result}
                      onChange={(e) =>
                        updateRow(index, "result", e.target.value)
                      }
                      style={{
                        width: "160px",
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(15,23,42,0.9)",
                        color: "#ffffff",
                      }}
                    >
                      <option>Pending</option>
                      <option>Win</option>
                      <option>Loss</option>
                      <option>Void</option>
                      <option>Race Abandoned</option>
                    </select>
                  </td>

                  <td style={{ padding: "12px" }}>
                    {money(row.returnAmount)}
                  </td>

                  <td
                    style={{
                      padding: "12px",
                      color:
                        row.profitLoss > 0
                          ? "#22c55e"
                          : row.profitLoss < 0
                          ? "#ef4444"
                          : "#94a3b8",
                      fontWeight: 800,
                    }}
                  >
                    {money(row.profitLoss)}
                  </td>

                  <td style={{ padding: "12px", fontWeight: 800 }}>
                    {money(row.closingBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={addMoreRows}
            style={{
              marginTop: "18px",
              padding: "12px 18px",
              borderRadius: "12px",
              border: "1px solid rgba(56,189,248,0.35)",
              background: "rgba(56,189,248,0.14)",
              color: "#38bdf8",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Add 10 More Rows
          </button>
        </section>
      </div>
    </main>
  );
}
