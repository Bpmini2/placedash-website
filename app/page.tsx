"use client";

import { useEffect, useState } from "react";

const demoPredictions = [
  {
    time: "12:45",
    track: "Flemington",
    race: "Race 4",
    runners: 10,
    horse: "Silver Command",
    confidence: "HIGH",
  },
  {
    time: "13:20",
    track: "Randwick",
    race: "Race 6",
    runners: 9,
    horse: "Eastern Star",
    confidence: "MEDIUM",
  },
  {
    time: "14:05",
    track: "Caulfield",
    race: "Race 3",
    runners: 11,
    horse: "Metro Pulse",
    confidence: "HIGH",
  },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "Preview PlaceDash with limited daily insights.",
    features: [
      "Limited prediction access",
      "Basic race view",
      "Early access updates",
    ],
    highlighted: false,
  },
  {
    name: "Silver",
    price: "$9.99/month",
    description: "Unlock daily AI place analysis and confidence ratings.",
    features: [
      "Daily place predictions",
      "Confidence ratings",
      "Filtered racecards",
      "Track record access",
    ],
    highlighted: false,
  },
  {
    name: "Gold",
    price: "$19.99/month",
    description: "Full access to stronger PlaceDash analysis and priority picks.",
    features: [
      "Everything in Silver",
      "Priority high-confidence selections",
      "Full racecard analysis",
      "Advanced performance tracking",
      "Future premium insights",
    ],
    highlighted: true,
  },
];

function ConfidenceBadge({ level }: { level: string }) {
  return <span className={`badge ${level.toLowerCase()}`}>{level}</span>;
}

export default function Home() {
   const [predictions, setPredictions] = useState(demoPredictions);

  useEffect(() => {
    async function loadHomepageRaces() {
      try {
        const res = await fetch("/api/formfav");
        const data = await res.json();

        const livePredictions =
          data?.racecards?.slice(0, 3).map((race: any) => {
            const runners = race.runners || [];
            const firstRunner = runners[0];

            return {
              time: race.off_time || "TBA",
              track: race.course || "Unknown",
              race: `Race ${race.race_number || ""}`,
              runners: race.runner_count || runners.length || 0,
              horse: firstRunner?.horse || "View dashboard",
              confidence: "LIVE",
            };
          }) || [];

        if (livePredictions.length > 0) {
          setPredictions(livePredictions);
        }
      } catch (error) {
        console.error("Homepage live races failed:", error);
      }
    }

    loadHomepageRaces();
  }, []); 
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
    padding: "22px 52px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
  }}
>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "auto 1fr auto",
      alignItems: "center",
      gap: "48px",
      width: "100%",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "18px",
      }}
    >
      <div
        style={{
          width: "86px",
          height: "86px",
          borderRadius: "20px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
  src="/placedash-logo.png"
  alt="PlaceDash"
  style={{
    width: "220px",
    height: "auto",
    objectFit: "contain",
    display: "block",
  }}
/>
      </div>

      <span
        style={{
          fontSize: "46px",
          fontWeight: 800,
          color: "#07111f",
          letterSpacing: "-1.5px",
          lineHeight: 1,
        }}
      >
        PlaceDash
      </span>
    </div>

    <nav
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "48px",
      }}
    >
      <a style={{ color: "#07111f", fontWeight: 700, textDecoration: "none" }} href="/dashboard">Predictions</a>
      <a style={{ color: "#07111f", fontWeight: 700, textDecoration: "none" }} href="#method">Method</a>
      <a style={{ color: "#07111f", fontWeight: 700, textDecoration: "none" }} href="#track-record">Track Record</a>
      <a style={{ color: "#07111f", fontWeight: 700, textDecoration: "none" }} href="#pricing">Pricing</a>
    </nav>

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
        whiteSpace: "nowrap",
      }}
    >
      View Today’s Picks
    </a>
  </div>
</header>

        <section className="hero">
          <div>
            <div className="pill">Australian racing only • Place analysis</div>

            <h1>Daily AI Place Picks for Australian Racing</h1>

            <p>
              PlaceDash analyses Australian horse races using strict race filters,
              recent form, place history, field size, and confidence scoring to
              highlight disciplined place-racing opportunities.
            </p>

            <div className="heroButtons">
              <a className="primaryButton" href="/dashboard">
                View Today’s Best Picks
              </a>
              <a className="secondaryButton" href="#method">
                See The PlaceDash Method
              </a>
            </div>
          </div>

          <div className="previewCard">
            <div className="sectionTop">
              <div>
                <span>Today’s Snapshot</span>
                <h2>Filtered Race Card</h2>
              </div>
            </div>

            {predictions.map((p) => (
              <div className="miniCard" key={`${p.track}-${p.race}`}>
                <div className="raceHeader">
                  <div>
                    <strong>
                      {p.track} {p.race}
                    </strong>
                    <small>
                      {p.time} • {p.runners} active runners
                    </small>
                  </div>
                  <ConfidenceBadge level={p.confidence} />
                </div>

                <p>
                  Top Rated: <b>{p.horse}</b>
                </p>
              </div>
            ))}

            <p className="smallDisclaimer">
              Example preview only. Live selections are shown inside the
              dashboard.
            </p>
          </div>
        </section>

        <section id="method" className="section darkSection">
          <div className="sectionTitle center">
            <span>The PlaceDash Method</span>
            <h2>Built around disciplined place-racing analysis</h2>
            <p>
              PlaceDash is not designed to chase every race or every favourite.
              It focuses on filtered Australian races where place terms and race
              structure make sense for analysis.
            </p>
          </div>

          <div className="statsGrid">
            <div>
              <strong>Top 3</strong>
              <span>
                A place result usually means the runner finishes 1st, 2nd or 3rd,
                depending on active runner numbers.
              </span>
            </div>

            <div>
              <strong>8–11</strong>
              <span>
                PlaceDash only analyses races with 8 to 11 active runners.
              </span>
            </div>

            <div>
              <strong>3+</strong>
              <span>
                First starters are removed. Runners need at least 3 previous
                starts.
              </span>
            </div>

            <div>
              <strong>Value</strong>
              <span>
                The aim is not just low odds. The aim is disciplined analysis and
                better decision-making.
              </span>
            </div>
          </div>

          <div className="dashboardPreview" style={{ marginTop: "32px" }}>
            <div>
              <span>Common-sense place strategy</span>
              <h2>Why low odds are not always the best answer</h2>

              <p>
                A runner paying $1.30 may look safe, but one failed place result
                can wipe out many small wins. PlaceDash is designed to help users
                think beyond “safe favourites” and focus on structured analysis.
              </p>

              <p>
                A $100 place bet at $1.70 returns $170 total, or $70 profit if
                the runner places. A larger stake can increase profit, but it also
                increases the damage when a selection misses.
              </p>

              <p>
                Over time, the important question is not only strike rate. The
                more important measure is whether the selections produce a
                positive return after many races.
              </p>

              <p className="smallDisclaimer">
                PlaceDash provides racing data analysis only. It does not
                guarantee outcomes, provide financial advice, or recommend that
                users gamble.
              </p>
            </div>
          </div>
        </section>

        <section id="predictions" className="section">
  <div className="sectionTitle center">
    <span>Today’s Predictions</span>
    <h2>Live qualifying races appear here daily</h2>

    <p>
      PlaceDash only displays Australian races that pass the platform filters:
      8–11 active runners, no first starters, and runners with previous race
      experience.
    </p>
  </div>

  {predictions === demoPredictions ? (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        textAlign: "center",
        padding: "40px",
        borderRadius: "28px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        No live qualifying races available right now
      </h3>

      <p
        style={{
          color: "#cbd5e1",
          lineHeight: 1.7,
        }}
      >
        Live racecards automatically appear here when qualifying Australian
        races become available during the day.
      </p>

      <p
        style={{
          color: "#94a3b8",
          fontSize: "14px",
          marginTop: "20px",
        }}
      >
        The live dashboard still contains full AI analysis, race filtering,
        confidence ratings, and premium selections.
      </p>

      <div style={{ marginTop: "30px" }}>
        <a className="primaryButton" href="/dashboard">
          Open Live Dashboard
        </a>
      </div>
    </div>
  ) : (
    <>
      <div className="predictionGrid">
        {predictions.map((p) => (
          <div className="predictionCard" key={`${p.track}-${p.race}`}>
            <div className="raceHeader">
              <div>
                <h3>
                  {p.track} {p.race}
                </h3>

                <small>
                  {p.time} • {p.runners} active runners
                </small>
              </div>

              <ConfidenceBadge level={p.confidence} />
            </div>

            <div className="selectionBox">
              <small>Top Rated Selection</small>
              <strong>{p.horse}</strong>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "28px" }}>
        <a className="primaryButton" href="/dashboard">
          Open Live Dashboard
        </a>
      </div>
    </>
  )}
</section>

        <section id="track-record" className="section darkSection">
          <div className="sectionTitle center">
            <span>Track Record</span>
            <h2>Transparent performance tracking</h2>
            <p>
              PlaceDash will track selections over time so users can review
              results, strike rate, and return performance.
            </p>
            <p className="smallDisclaimer">
              Example results shown for demonstration only. Not indicative of
              future performance.
            </p>
          </div>

          <div className="statsGrid">
            <div>
              <strong>62%</strong>
              <span>Example 7 day strike rate</span>
            </div>
            <div>
              <strong>+14%</strong>
              <span>Example ROI</span>
            </div>
            <div>
              <strong>21 / 34</strong>
              <span>Example placed selections</span>
            </div>
            <div>
              <strong>Pending</strong>
              <span>Live historical tracking coming soon</span>
            </div>
          </div>
        </section>

        <section id="pricing" className="section">
          <div className="sectionTitle center">
            <span>Pricing</span>
            <h2>Choose Your Access</h2>
            <p>
              Start free, upgrade later. Built for disciplined racing analysis and
              structured decision-making.
            </p>
          </div>

          <div className="pricingGrid">
            {plans.map((plan) => (
              <div
                className={plan.highlighted ? "planCard popular" : "planCard"}
                key={plan.name}
              >
                {plan.highlighted && (
                  <div className="popularBadge">Most Popular</div>
                )}

                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
                <strong className="price">{plan.price}</strong>

                <ul>
                  {plan.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>

                <a
                  className={
                    plan.highlighted ? "primaryButton full" : "secondaryButton full"
                  }
                  href="/dashboard"
                >
                  {plan.highlighted ? "Unlock Gold Access" : "View Plan"}
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="section darkSection">
          <div className="dashboardPreview">
            <div>
              <span>Dashboard Preview</span>
              <h2>Built for quick daily decisions</h2>
              <p>
                Users can view filtered races, confidence ratings, full racecard
                analysis, AI reasoning summaries, and locked premium selections in
                one clean dashboard.
              </p>

              <div className="heroButtons">
                <a className="primaryButton" href="/dashboard">
                  View Dashboard
                </a>
                <a className="secondaryButton" href="#pricing">
                  Compare Plans
                </a>
              </div>
            </div>

            <div className="mockWindow">
              <div className="windowDots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="mockLine wide"></div>
              <div className="mockBox green"></div>
              <div className="mockBox"></div>
              <div className="mockBox"></div>
            </div>
          </div>
        </section>

        <footer
          style={{
            padding: "30px 40px",
            textAlign: "center",
            color: "#94a3b8",
          }}
        >
          <p>© 2026 PlaceDash. Information and data-analysis service only.</p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              marginTop: "10px",
            }}
          >
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms</a>
            <a href="/disclaimer">Disclaimer</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
