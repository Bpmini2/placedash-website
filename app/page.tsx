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
                  background: "#22c55e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#07111f",
                  fontSize: "30px",
                  fontWeight: 900,
                  fontStyle: "italic",
                  letterSpacing: "-3px",
                  boxShadow: "0 10px 25px rgba(34,197,94,0.35)",
                }}
              >
                123
              </div>
              <span style={{ fontSize: "44px", fontWeight: 900, color: "#07111f" }}>
                PlaceDash
              </span>
            </div>

            <nav style={{ display: "flex", gap: "42px" }}>
              <a href="/dashboard" style={{ color: "#07111f", fontWeight: 700, textDecoration: "none" }}>Predictions</a>
              <a href="#method" style={{ color: "#07111f", fontWeight: 700, textDecoration: "none" }}>Method</a>
              <a href="#track-record" style={{ color: "#07111f", fontWeight: 700, textDecoration: "none" }}>Track Record</a>
              <a href="#pricing" style={{ color: "#07111f", fontWeight: 700, textDecoration: "none" }}>Pricing</a>
            </nav>

            <a
              href="/dashboard"
              style={{
                background: "#22c55e",
                color: "#07111f",
                padding: "18px 34px",
                borderRadius: "16px",
                fontWeight: 900,
                textDecoration: "none",
                boxShadow: "0 16px 35px rgba(34,197,94,0.35)",
              }}
            >
              View Today’s Picks
            </a>
          </div>
        </header>

        <section style={{ padding: "90px 0 120px" }}>
          <div style={{ maxWidth: "760px" }}>
            <div style={{ display: "inline-block", padding: "10px 18px", borderRadius: "999px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)", color: "#86efac", fontWeight: 700, marginBottom: "24px" }}>
              Australian racing only • Place analysis
            </div>

            <h1 style={{ fontSize: "72px", lineHeight: "1.02", margin: 0, fontWeight: 900 }}>
              Daily AI Place Picks for Australian Racing
            </h1>

            <p style={{ color: "#dbeafe", fontSize: "20px", lineHeight: 1.7, marginTop: "26px" }}>
              PlaceDash analyses Australian horse races using strict race filters, recent form,
              place history, field size, and confidence scoring to highlight disciplined
              place-racing opportunities.
            </p>

            <div style={{ display: "flex", gap: "16px", marginTop: "32px" }}>
              <a href="/dashboard" style={{ background: "#22c55e", color: "#07111f", padding: "16px 28px", borderRadius: "16px", fontWeight: 900, textDecoration: "none" }}>
                View Today’s Best Picks
              </a>
              <a href="#method" style={{ color: "#ffffff", padding: "16px 28px", borderRadius: "16px", fontWeight: 800, textDecoration: "none", border: "1px solid rgba(255,255,255,0.25)" }}>
                See The PlaceDash Method
              </a>
            </div>
          </div>
        </section>

        <section id="predictions" style={{ padding: "80px 24px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ color: "#22c55e", fontSize: "14px", fontWeight: 900, letterSpacing: "0.14em", marginBottom: "18px" }}>
            TODAY&apos;S PREDICTIONS
          </div>
          <h2 style={{ fontSize: "46px", margin: 0 }}>
            Qualifying races appear inside the live dashboard
          </h2>
          <p style={{ maxWidth: "850px", margin: "22px auto 0", color: "#dbeafe", fontSize: "18px", lineHeight: 1.7 }}>
            PlaceDash only displays Australian races that pass the platform filters: 8–11
            active runners, no first starters, and runners with previous race experience.
          </p>
          <a href="/dashboard" style={{ display: "inline-block", marginTop: "28px", background: "#22c55e", color: "#07111f", padding: "18px 34px", borderRadius: "16px", fontWeight: 900, fontSize: "18px", textDecoration: "none" }}>
            Open Live Dashboard
          </a>
        </section>

        <section id="method" style={{ padding: "90px 0", textAlign: "center" }}>
          <div style={{ color: "#22c55e", fontSize: "14px", fontWeight: 900, letterSpacing: "0.14em" }}>
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
                <h3 style={{ color: "#86efac", fontSize: "34px", margin: 0 }}>{title}</h3>
                <p style={{ color: "#bfdbfe", lineHeight: 1.6 }}>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="track-record" style={{ padding: "90px 0", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ color: "#22c55e", fontSize: "14px", fontWeight: 900, letterSpacing: "0.14em" }}>
            TRACK RECORD
          </div>
          <h2 style={{ fontSize: "42px", marginTop: "14px" }}>
            Transparent performance tracking
          </h2>
          <p style={{ color: "#dbeafe" }}>
            PlaceDash will track selections over time so users can review results, strike rate, and return performance.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px", marginTop: "34px" }}>
            {[
              ["62%", "Example 7 day strike rate"],
              ["+14%", "Example ROI"],
              ["21 / 34", "Example placed selections"],
              ["Pending", "Live historical tracking coming soon"],
            ].map(([title, text]) => (
              <div key={title} style={{ textAlign: "left", padding: "26px", borderRadius: "22px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
                <h3 style={{ color: "#86efac", fontSize: "34px", margin: 0 }}>{title}</h3>
                <p style={{ color: "#bfdbfe" }}>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" style={{ padding: "90px 0", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ color: "#22c55e", fontSize: "14px", fontWeight: 900, letterSpacing: "0.14em" }}>
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
              <div key={plan} style={{ padding: "28px", borderRadius: "24px", background: plan === "Gold" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.08)", border: plan === "Gold" ? "1px solid #22c55e" : "1px solid rgba(255,255,255,0.14)" }}>
                <h3>{plan}</h3>
                <p style={{ color: "#dbeafe" }}>{desc}</p>
                <h2 style={{ fontSize: "34px" }}>{price}</h2>
                <a href="/dashboard" style={{ display: "block", textAlign: "center", marginTop: "24px", padding: "14px", borderRadius: "14px", background: plan === "Gold" ? "#22c55e" : "transparent", color: plan === "Gold" ? "#07111f" : "#ffffff", border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none", fontWeight: 800 }}>
                  View Plan
                </a>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: "80px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ padding: "36px", borderRadius: "28px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
            <div style={{ color: "#22c55e", fontSize: "14px", fontWeight: 900, letterSpacing: "0.14em" }}>
              DASHBOARD PREVIEW
            </div>
            <h2>Built for quick daily decisions</h2>
            <p style={{ color: "#dbeafe", maxWidth: "680px", lineHeight: 1.7 }}>
              Users can view filtered races, confidence ratings, full racecard analysis,
              AI reasoning summaries, and locked premium selections in one clean dashboard.
            </p>
            <a href="/dashboard" style={{ display: "inline-block", marginTop: "18px", background: "#22c55e", color: "#07111f", padding: "14px 24px", borderRadius: "14px", fontWeight: 900, textDecoration: "none" }}>
              View Dashboard
            </a>
          </div>
        </section>

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
