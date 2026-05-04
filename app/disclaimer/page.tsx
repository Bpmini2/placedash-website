export default function DisclaimerPage() {
  return (
    <main style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Disclaimer</h1>

      <p>
        PlaceDash AI provides AI-generated horse racing place predictions for informational and entertainment purposes only.
      </p>

      <h2>No Betting Advice</h2>
      <p>
        The information provided on this platform does NOT constitute financial advice, betting advice, or investment advice.
      </p>

      <h2>Gambling Risk</h2>
      <p>
        Gambling involves risk. You may lose money. You should only gamble what you can afford to lose.
      </p>

      <h2>No Guarantees</h2>
      <p>
        We make no guarantees regarding the accuracy, reliability, or performance of any predictions or data presented.
      </p>

      <h2>Past Performance</h2>
      <p>
        Past performance is not indicative of future results.
      </p>

      <h2>User Responsibility</h2>
      <p>
        You accept full responsibility for any decisions made based on the information provided by this platform.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        PlaceDash AI will not be held liable for any financial losses or damages resulting from the use of this service.
      </p>

      <h2>Support</h2>
      <p>
        If you need help with gambling-related issues, contact Gambling Help Online (Australia) at www.gamblinghelponline.org.au or call 1800 858 858.
      </p>

      <p style={{ marginTop: "20px", fontSize: "12px", color: "#94a3b8" }}>
        Last updated: {new Date().toLocaleDateString("en-AU")}
      </p>
    </main>
  );
}
