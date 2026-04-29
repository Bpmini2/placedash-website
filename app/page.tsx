const predictions = [
  { time: "12:45", track: "Flemington", race: "Race 4", runners: 10, horse: "Silver Command", confidence: "HIGH" },
  { time: "13:20", track: "Randwick", race: "Race 6", runners: 9, horse: "Eastern Star", confidence: "MEDIUM" },
  { time: "14:05", track: "Caulfield", race: "Race 3", runners: 11, horse: "Metro Pulse", confidence: "HIGH" },
  { time: "15:10", track: "Doomben", race: "Race 7", runners: 8, horse: "Bold Runner", confidence: "LOW" },
];

const plans = [
  { name: "Starter", price: "Free", description: "Preview PlaceDash and see limited insights.", features: ["Limited predictions", "Basic race view", "Early access updates"], button: "Join Early Access", highlighted: false },
  { name: "Pro", price: "$9.99/mo", description: "For users who want full daily place predictions.", features: ["Full daily predictions", "Confidence ratings", "Daily race filtering", "Track record view"], button: "Coming Soon", highlighted: true },
  { name: "Elite", price: "$19.99/mo", description: "Advanced insights for serious users.", features: ["Everything in Pro", "Priority high-confidence picks", "Advanced performance tracking", "Future premium insights"], button: "Coming Soon", highlighted: false },
];

function ConfidenceBadge({ level }: { level: string }) {
  return <span className={`badge ${level.toLowerCase()}`}>{level}</span>;
}

export default function Home() {
  return (
    <main>
      <header className="header">
        <div className="brand"><div className="logo">PD</div><strong>PlaceDash</strong></div>
        <nav><a href="#predictions">Predictions</a><a href="#track-record">Track Record</a><a href="#pricing">Pricing</a></nav>
        <a className="headerButton" href="#predictions">View Today’s Picks</a>
      </header>

      <section className="hero">
        <div>
          <div className="pill">Australian racing only • Place predictions</div>
          <h1>Daily AI Place Picks for Australian Racing</h1>
          <p>Get daily place betting insights backed by data-driven analysis, strict race filtering...</p>
          <div className="heroButtons">
            <a className="primaryButton" href="#predictions">View Today’s Best Picks</a>
            <a className="secondaryButton" href="#pricing">Unlock Full Access</a>
          </div>
        </div>
        <div className="previewCard">
          <div className="sectionTop"><div><span>Today’s Snapshot</span><h2>Filtered Race Card</h2></div></div>
          {predictions.slice(0, 3).map((p) => (
            <div className="miniCard" key={`${p.track}-${p.race}`}>
              <div className="raceHeader"><div><strong>{p.track} {p.race}</strong><small>{p.time} • {p.runners} runners</small></div><ConfidenceBadge level={p.confidence} /></div>
              <p>Selection: <b>{p.horse}</b></p>
            </div>
          ))}
        </div>
      </section>

      <section id="predictions" className="section darkSection">
        <div className="sectionTitle"><span>Today’s Predictions</span><h2>Daily Place Predictions</h2><p>Only races matching PlaceDash criteria are shown: Australian races, 8–11 runners, no first starters, and horses with 3+ previous starts.</p></div>
        <div className="predictionGrid">
          {predictions.map((p) => (
            <div className="predictionCard" key={`${p.track}-${p.race}`}>
              <div className="raceHeader"><div><h3>{p.track} {p.race}</h3><small>{p.time} • {p.runners} runners</small></div><ConfidenceBadge level={p.confidence} /></div>
              <div className="selectionBox"><small>Place Selection</small><strong>{p.horse}</strong></div>
            </div>
          ))}
        </div>
      </section>

      <section id="rules" className="section">
        <div className="sectionTitle"><span>Race Filtering Logic</span><h2>Strict selection rules</h2></div>
        <div className="rulesGrid">
          <div>Australian races only</div><div>Field size between 8 and 11 runners</div><div>No first starters</div><div>Horses must have 3+ previous starts</div><div>Jockey and trainer performance considered</div><div>Confidence rating shown for each selection</div>
        </div>
      </section>

      <section id="track-record" className="section">
        <div className="sectionTitle"><span>Track Record</span><h2>Transparent Performance Tracking</h2></div>
        <div className="statsGrid">
          <div><strong>18</strong><span>Races analysed today</span></div><div><strong>12</strong><span>Selections made</span></div><div><strong>8</strong><span>Successful place finishes</span></div><div><strong>66%</strong><span>Example place strike rate</span></div>
        </div>
      </section>

      <section id="pricing" className="section darkSection">
        <div className="sectionTitle center"><span>Pricing</span><h2>Simple Pricing — Payments Coming Soon</h2><p>Join early access while PlaceDash is being prepared for full launch.</p></div>
        <div className="pricingGrid">
          {plans.map((plan) => (
            <div className={plan.highlighted ? "planCard popular" : "planCard"} key={plan.name}>
              {plan.highlighted && <div className="popularBadge">Most Popular</div>}
              <h3>{plan.name}</h3><p>{plan.description}</p><strong className="price">{plan.price}</strong>
              <ul>{plan.features.map((f) => <li key={f}>• {f}</li>)}</ul>
              <a className={plan.highlighted ? "primaryButton full" : "secondaryButton full"} href="#predictions">{plan.button}</a>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="dashboardPreview">
          <div><span>Dashboard Preview</span><h2>Built for quick daily decisions</h2><p>Users will see filtered races, place selections, confidence ratings, and performance tracking in one clean dashboard.</p></div>
          <div className="mockWindow"><div className="windowDots"><span></span><span></span><span></span></div><div className="mockLine wide"></div><div className="mockBox green"></div><div className="mockBox"></div><div className="mockBox"></div></div>
        </div>
      </section>
<section id="track-record" className="section darkSection">
  <div className="sectionTitle center">
    <span>Track Record</span>
    <h2>Proven Results</h2>
    <p>Transparent performance based on recent selections.</p>
    <p style="margin-top:10px;color:#94a3b8;font-size:12px;">
Example results shown for demonstration purposes only. Not indicative of future performance.
</p>
  </div>

  <div className="statsGrid">
    <div>
      <strong>62%</strong>
      <span>7 Day Strike Rate</span>
    </div>
    <div>
      <strong>+14%</strong>
      <span>ROI (Last 7 Days)</span>
    </div>
    <div>
      <strong>21 / 34</strong>
      <span>Winning Selections</span>
    </div>
    <div>
      <strong>Consistent</strong>
      <span>Daily Opportunities</span>
    </div>
  </div>
</section>
      <footer><p>© 2026 PlaceDash. Information and data-analysis service only.</p><div><a href="#">Privacy Policy</a><a href="#">Terms</a><a href="#">Disclaimer</a></div></footer>
    
    </main>
  );
}
