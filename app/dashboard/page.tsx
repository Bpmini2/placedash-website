export default function Dashboard() {
  return (
    <main style={{padding: "40px", maxWidth: "1000px", margin: "0 auto"}}>
      
      <h1>Dashboard Preview</h1>
      <p style={{color:"#94a3b8"}}>Today’s AI-powered place selections</p>

      <div style={{marginTop:"30px", display:"grid", gap:"20px"}}>

        <div style={{padding:"20px", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"16px"}}>
          <h3>Flemington Race 4</h3>
<p style={{color:"#94a3b8", marginTop:"6px"}}>Saturday • 12:45 PM • 10 runners</p>

<p style={{marginTop:"10px"}}>
  Selection: <strong>Silver Command</strong>
</p>

<span style={{color:"#22c55e"}}>HIGH CONFIDENCE</span>
        </div>

        <div style={{padding:"20px", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"16px"}}>
          <h3>Randwick Race 6</h3>
          <p style={{color:"#94a3b8", marginTop:"6px"}}>Saturday • 1:20 PM • 9 runners</p>
          <p>Selection: <strong>Eastern Star</strong></p>
          <span style={{color:"#eab308"}}>MEDIUM CONFIDENCE</span>
        </div>

        <div style={{padding:"20px", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"16px", opacity:0.5}}>
          <h3>Premium Picks Locked 🔒</h3>
          <p style={{color:"#94a3b8"}}>
  You're viewing 2 of 5 selections today.
</p>

<p style={{marginTop:"6px"}}>
  Upgrade to unlock the remaining high-confidence picks.
</p>
          <a href="/#pricing" style={{
  display: "inline-block",
  marginTop: "15px",
  padding: "10px 16px",
  background: "#22c55e",
  color: "#000",
  borderRadius: "10px",
  fontWeight: "600"
}}>
  Upgrade to Pro
</a>
          <div style={{
  marginTop: "25px",
  display: "grid",
  gap: "15px",
  filter: "blur(3px)",
  opacity: 0.45,
  pointerEvents: "none"
}}>
  <div style={{padding:"16px", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px"}}>
    <h4>Caulfield Race 3</h4>
    <p>Selection: Hidden Pick</p>
    <span>HIGH CONFIDENCE</span>
  </div>

  <div style={{padding:"16px", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px"}}>
    <h4>Doomben Race 7</h4>
    <p>Selection: Hidden Pick</p>
    <span>MEDIUM CONFIDENCE</span>
  </div>
</div>
        </div>

      </div>

    </main>
  )
}
