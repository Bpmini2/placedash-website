import React, { useEffect, useState } from "react";
export default function Dashboard() {
const [races, setRaces] = useState([]);
useEffect(() => {
  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": "PASTE YOUR KEY HERE",
      "X-RapidAPI-Host": "the-racing-api.p.rapidapi.com"
    }
  };

  fetch("https://the-racing-api.p.rapidapi.com/v1/racecards/free?day=today", options)
    .then(res => res.json())
    .then(data => {
      console.log(data);
     setRaces(data.racecards || []);
});
    .catch(err => console.error(err));
}, []);
  
  return (
    <main style={{padding: "40px", maxWidth: "1000px", margin: "0 auto"}}>
      
      <h1>Dashboard Preview</h1>
      <p style={{color:"#94a3b8"}}>Today’s AI-powered place selections</p>

      <div style={{marginTop:"30px", display:"grid", gap:"20px"}}>
{races.slice(0, 3).map((race, index) => (
  <div key={index} style={{padding:"20px", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"16px"}}>
    
    <h3>{race.course} Race {race.race_number}</h3>

    <p style={{color:"#94a3b8"}}>
      {race.off_time} • {race.runners?.length || 0} runners
    </p>

    <p style={{marginTop:"10px"}}>
      Selection: <strong>{race.runners?.[0]?.horse || "TBD"}</strong>
    </p>

    <span style={{color:"#22c55e"}}>HIGH CONFIDENCE</span>

  </div>
))}
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
 <p style={{marginTop:"20px", fontWeight:"600"}}>
🔥 Today’s Top Rated Picks (Pro Only)
</p>         
          <div style={{
  marginTop: "25px",
  display: "grid",
  gap: "15px",
  
  opacity: 0.85,
  pointerEvents: "none"
}}>
  <div style={{padding:"16px", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px"}}>
    <h4>Caulfield Race 3</h4>
    <p>Selection: 🔒 Locked (Upgrade Required)</p>
    <span>HIGH CONFIDENCE</span>
  </div>

  <div style={{padding:"16px", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px"}}>
    <h4>Doomben Race 7</h4>
    <p>Selection: 🔒 Locked (Upgrade Required)</p>
    <span>MEDIUM CONFIDENCE</span>
  </div>
</div>
        </div>

      </div>

    </main>
  )
}
