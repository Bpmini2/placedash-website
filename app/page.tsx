"use client";

export default function HomePage() {
  return (
    <main
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: "0 32px",
        backgroundImage:
          'linear-gradient(rgba(2,8,18,0.82), rgba(2,8,18,0.86)), url("/raceday.png")',
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
        color: "#ffffff",
      }}
    >
      <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
        <header
          style={{
            width: "calc(100vw - 44px)",
            marginLeft: "calc(50% - 50vw + 22px)",
            marginTop: "18px",
            background: "rgba(255,255,255,0.97)",
            borderRadius: "30px",
            padding: "22px 48px",
            boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
              <span style={{ fontSize: "44px", fontWeight: 900, color: "#07111f" }}>
                PlaceDash
              </span>
            </div>

            <nav style={{ display: "flex", gap: "42px" }}>
              <a href="/dashboard" style={{ color: "#07111f", fontWeight: 700, textDecoration: "none" }}>Dashboard</a>
              <a href="#method" style={{ color: "#07111f", fontWeight: 700, textDecoration: "none" }}>Method</a>
              <a href="#track-record" style={{ color: "#07111f", fontWeight: 700, textDecoration: "none" }}>Track Record</a>
              <a href="/bankroll-calculator" style={{ color: "#07111f", fontWeight: 700, textDecoration: "none" }}>Bankroll Planner</a>
              <a href="#pricing" style={{ color: "#07111f", fontWeight: 700, textDecoration: "none" }}>Pricing</a>
            </nav>

            <a
              href="/dashboard"
              style={{
                background: "#38bdf8",
                color: "#07111f",
                padding: "18px 34px",
                borderRadius: "16px",
                fontWeight: 900,
                textDecoration: "none",
                boxShadow: "0 16px 35px rgba(56,189,248,0.35)",
              }}
            >
              View Today’s Picks
            </a>
          </div>
        </header>

        <section style={{ padding: "90px 0 120px" }}>
          <div style={{ maxWidth: "760px" }}>
            <div style={{ display: "inline-block", padding: "10px 18px", borderRadius: "999px", background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.35)", color: "#7dd3fc", fontWeight: 700, marginBottom: "24px" }}>
              Australian racing only • Place analysis
            </div>

            <h1
  style={{
    fontSize: "clamp(38px, 5.2vw, 60px)",
    lineHeight: "1.02",
    margin: 0,
    fontWeight: 900,
  }}
>
              Daily AI Place Picks for Australian Racing
            </h1>

            <p style={{ color: "#dbeafe", fontSize: "20px", lineHeight: 1.7, marginTop: "26px" }}>
              PlaceDash analyses Australian horse races using strict race filters, recent form,
              place history, field size, and confidence scoring to highlight disciplined
              place-racing opportunities.
            </p>

            <div style={{ display: "flex", gap: "16px", marginTop: "32px" }}>
              <a href="/dashboard" style={{ background: "#38bdf8", color: "#07111f", padding: "16px 28px", borderRadius: "16px", fontWeight: 900, textDecoration: "none" }}>
                View Today’s Best Picks
              </a>
             
              <a href="#method" style={{ color: "#ffffff", padding: "16px 28px", borderRadius: "16px", fontWeight: 800, textDecoration: "none", border: "1px solid rgba(255,255,255,0.25)" }}>
                See The PlaceDash Method
              </a>
              
            </div>
          </div>
        </section>
<p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "14px", lineHeight: 1.5, maxWidth: "760px" }}>
  Gamble responsibly. PlaceDash provides racing analysis and information only — it is not betting advice and does not guarantee results. If gambling is becoming a problem, contact Gambling Help Online on 1800 858 858 or visit BetStop for self-exclusion support.
</p>
        <section id="predictions" style={{ padding: "80px 24px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ color: "#38bdf8", fontSize: "14px", fontWeight: 900, letterSpacing: "0.14em", marginBottom: "18px" }}>
            TODAY&apos;S PREDICTIONS
          </div>
          <h2 style={{ fontSize: "46px", margin: 0 }}>
            Qualifying races appear inside the live dashboard
          </h2>
          <p style={{ maxWidth: "850px", margin: "22px auto 0", color: "#dbeafe", fontSize: "18px", lineHeight: 1.7 }}>
            PlaceDash only displays Australian races that pass the platform filters: 8–11
            active runners, no first starters, and runners with previous race experience.
          </p>
          <a href="/dashboard" style={{ display: "inline-block", marginTop: "28px", background: "#38bdf8", color: "#07111f", padding: "18px 34px", borderRadius: "16px", fontWeight: 900, fontSize: "18px", textDecoration: "none" }}>
            Open Live Dashboard
          </a>
        </section>

        <section id="method" style={{ padding: "90px 0", textAlign: "center" }}>
          <div style={{ color: "#38bdf8", fontSize: "14px", fontWeight: 900, letterSpacing: "0.14em" }}>
            THE PLACEDASH METHOD
          </div>
          <h2 style={{ fontSize: "42px", marginTop: "14px" }}>
            Built around disciplined place-racing analysis
          </h2>
          <p style={{ color: "#dbeafe", maxWidth: "850px", margin: "0 auto 38px", lineHeight: 1.7 }}>
            PlaceDash is not designed to chase every race or every favourite. It focuses on
            filtered Australian races where place terms and race structure make sense for analysis.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px" }}>
            {[
              ["Top 3", "A place result usually means the runner finishes 1st, 2nd or 3rd."],
              ["8–11", "PlaceDash only analyses races with 8 to 11 active runners."],
              ["3+", "First starters are removed. Runners need at least 3 previous starts."],
              ["Value", "The aim is disciplined analysis and better decision-making."],
            ].map(([title, text]) => (
              <div key={title} style={{ textAlign: "left", padding: "26px", borderRadius: "24px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
                <h3 style={{ color: "#7dd3fc", fontSize: "34px", margin: 0 }}>{title}</h3>
                <p style={{ color: "#bfdbfe", lineHeight: 1.6 }}>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="track-record" style={{ padding: "90px 0", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ color: "#38bdf8", fontSize: "14px", fontWeight: 900, letterSpacing: "0.14em" }}>
            HOW PLACEDASH WORKS
          </div>
          <h2 style={{ fontSize: "42px", marginTop: "14px" }}>
            AI-powered race filtering and performance tracking
          </h2>
          <p style={{ color: "#dbeafe" }}>
            PlaceDash automatically filters Australian races, saves AI selections before race start, and tracks historical performance over time.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px", marginTop: "34px" }}>
            {[
  ["LIVE FILTERING", "Australian races filtered automatically using PlaceDash AI rules"],
  ["AI DATA STORAGE", "Selections saved before races begin for historical tracking"],
  ["PERFORMANCE METRICS", "Strike rate, ROI, and AI performance tracked automatically"],
  ["HISTORICAL RESULTS", "View long-term AI selection performance and race history"],
].map(([title, text]) => (
              <div key={title} style={{ textAlign: "left", padding: "26px", borderRadius: "22px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
                <h3 style={{ color: "#7dd3fc", fontSize: "34px", margin: 0 }}>{title}</h3>
                <p style={{ color: "#bfdbfe" }}>{text}</p>
              </div>
            ))}
          </div>
        </section>
<section
  id="bankroll-planner"
  style={{
    padding: "90px 0",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  }}
>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "34px",
      alignItems: "center",
    }}
  >
    <div>
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
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Bankroll Planning Tool
      </div>

      <h2
        style={{
          fontSize: "42px",
          lineHeight: 1.05,
          margin: "0 0 16px 0",
          color: "#ffffff",
        }}
      >
        PlaceDash Bankroll Planner
      </h2>

      <p
        style={{
          color: "#b7c5d8",
          fontSize: "17px",
          lineHeight: 1.7,
          marginBottom: "22px",
        }}
      >
        Plan your staking before you bet. Enter your starting balance, actual bet
        amount, dividend, and result to see your running balance and next
        suggested stake.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "26px",
          color: "#cbd5e1",
          fontSize: "14px",
          lineHeight: 1.5,
        }}
      >
        <div>✓ Suggested 10% stake</div>
        <div>✓ Actual bet override</div>
        <div>✓ Win / Loss / Void</div>
        <div>✓ Race Abandoned option</div>
        <div>✓ Running bank balance</div>
        <div>✓ Next suggested bet</div>
      </div>

      <a
        href="/bankroll-calculator"
        style={{
          display: "inline-block",
          background: "#38bdf8",
          color: "#07111f",
          padding: "15px 26px",
          borderRadius: "14px",
          fontWeight: 900,
          textDecoration: "none",
          boxShadow: "0 14px 30px rgba(56,189,248,0.28)",
        }}
      >
        Open Bankroll Planner
      </a>
    </div>

    <div
      style={{
        padding: "22px",
        borderRadius: "26px",
        background: "rgba(15,23,42,0.72)",
        border: "1px solid rgba(56,189,248,0.24)",
        boxShadow: "0 24px 70px rgba(0,0,0,0.34)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            padding: "16px",
            borderRadius: "16px",
            background: "rgba(2,8,18,0.62)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 800 }}>
            Current Balance
          </div>
          <div style={{ color: "#22c55e", fontSize: "28px", fontWeight: 900 }}>
            $2,324.65
          </div>
        </div>

        <div
          style={{
            padding: "16px",
            borderRadius: "16px",
            background: "rgba(2,8,18,0.62)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 800 }}>
            Next Suggested Bet
          </div>
          <div style={{ color: "#38bdf8", fontSize: "28px", fontWeight: 900 }}>
            $232.47
          </div>
        </div>
      </div>

      <div
        style={{
          overflow: "hidden",
          borderRadius: "18px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {[
          ["1", "$1,570.00", "$157.00", "$157.00", "1.80", "Win", "+$125.60"],
          ["2", "$1,695.60", "$169.56", "$500.00", "2.60", "Win", "+$800.00"],
          ["3", "$2,495.60", "$249.56", "$249.56", "-", "Loss", "-$249.56"],
          ["4", "$2,246.04", "$224.60", "$224.60", "-", "Void", "$0.00"],
        ].map((row) => (
          <div
            key={row[0]}
            style={{
              display: "grid",
              gridTemplateColumns: "0.4fr 1fr 1fr 1fr 0.8fr 0.8fr 1fr",
              gap: "8px",
              padding: "12px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              color: "#cbd5e1",
              fontSize: "12px",
              alignItems: "center",
            }}
          >
            <strong>{row[0]}</strong>
            <span>{row[1]}</span>
            <span style={{ color: "#38bdf8", fontWeight: 800 }}>{row[2]}</span>
            <span>{row[3]}</span>
            <span>{row[4]}</span>
            <span>{row[5]}</span>
            <span
              style={{
                color: row[6].startsWith("+")
                  ? "#22c55e"
                  : row[6].startsWith("-")
                  ? "#ef4444"
                  : "#94a3b8",
                fontWeight: 900,
              }}
            >
              {row[6]}
            </span>
          </div>
        ))}
      </div>

      <p
        style={{
          marginTop: "14px",
          color: "#94a3b8",
          fontSize: "12px",
          lineHeight: 1.5,
        }}
      >
        Example display only. The planner saves your entries in your browser so
        you can come back later.
      </p>
    </div>
  </div>
</section>
        <section id="pricing" style={{ padding: "90px 0", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ color: "#38bdf8", fontSize: "14px", fontWeight: 900, letterSpacing: "0.14em" }}>
            PRICING
          </div>
          <h2 style={{ fontSize: "42px", marginTop: "14px" }}>Choose Your Access</h2>
          <p style={{ color: "#dbeafe" }}>
            Start free, upgrade later. Built for disciplined racing analysis and structured decision-making.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px", marginTop: "36px", textAlign: "left" }}>
            {[
              ["Starter", "Free", "Preview PlaceDash with limited daily insights."],
              ["Silver", "$9.99/month", "Unlock daily AI place analysis and confidence ratings."],
              ["Gold", "$19.99/month", "Full access to stronger PlaceDash analysis and priority picks."],
            ].map(([plan, price, desc]) => (
              <div key={plan} style={{ padding: "28px", borderRadius: "24px", background: plan === "Gold" ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.08)", border: plan === "Gold" ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.14)" }}>
                <h3>{plan}</h3>
                <p style={{ color: "#dbeafe" }}>{desc}</p>
                <h2 style={{ fontSize: "34px" }}>{price}</h2>
                <a href="/dashboard" style={{ display: "block", textAlign: "center", marginTop: "24px", padding: "14px", borderRadius: "14px", background: plan === "Gold" ? "#38bdf8" : "transparent", color: plan === "Gold" ? "#07111f" : "#ffffff", border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none", fontWeight: 800 }}>
                  View Plan
                </a>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: "80px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ padding: "36px", borderRadius: "28px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
            <div style={{ color: "#38bdf8", fontSize: "14px", fontWeight: 900, letterSpacing: "0.14em" }}>
              DASHBOARD PREVIEW
            </div>
            <h2>Built for quick daily decisions</h2>
            <p style={{ color: "#dbeafe", maxWidth: "680px", lineHeight: 1.7 }}>
              Users can view filtered races, confidence ratings, full racecard analysis,
              AI reasoning summaries, and locked premium selections in one clean dashboard.
            </p>
            <a href="/dashboard" style={{ display: "inline-block", marginTop: "18px", background: "#38bdf8", color: "#07111f", padding: "14px 24px", borderRadius: "14px", fontWeight: 900, textDecoration: "none" }}>
              View Dashboard
            </a>
          </div>
        </section>
<p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "24px", lineHeight: 1.5, textAlign: "center" }}>
  Gamble responsibly. PlaceDash provides racing analysis and information only — it is not betting advice and does not guarantee results. If gambling is becoming a problem, contact Gambling Help Online on 1800 858 858 or visit BetStop for self-exclusion support.
</p>
        <footer style={{ padding: "40px 0", textAlign: "center", color: "#bfdbfe", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p>© 2026 PlaceDash. Information and data-analysis service only.</p>
          <a href="/privacy" style={{ color: "#bfdbfe", marginRight: "16px" }}>Privacy Policy</a>
          <a href="/terms" style={{ color: "#bfdbfe", marginRight: "16px" }}>Terms</a>
          <a href="/disclaimer" style={{ color: "#bfdbfe" }}>Disclaimer</a>
        </footer>
      </div>
    </main>
  );
}
