export default function TermsPage() {
  return (
    <main style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Terms & Conditions</h1>

      <p>
        By using PlaceDash AI, you agree to these Terms & Conditions. If you do not agree, please do not use the platform.
      </p>

      <h2>1. Service Overview</h2>
      <p>
        PlaceDash AI provides AI-generated horse racing place predictions and related insights for informational purposes only.
      </p>

      <h2>2. No Betting or Financial Advice</h2>
      <p>
        The information provided is NOT financial advice or betting advice. All decisions made based on this information are at your own risk.
      </p>

      <h2>3. No Guarantee of Results</h2>
      <p>
        We do not guarantee the accuracy, completeness, or success of any predictions. Past performance is not indicative of future results.
      </p>

      <h2>4. User Responsibility</h2>
      <p>
        You are solely responsible for your actions, including any betting decisions and financial outcomes.
      </p>

      <h2>5. Subscriptions</h2>
      <p>
        Paid subscriptions provide access to premium features. Subscription fees are billed according to the selected plan.
      </p>

      <h2>6. Cancellations & Refunds</h2>
      <p>
        Subscriptions can be cancelled at any time. No refunds are provided for unused time unless required by law.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        PlaceDash AI is not liable for any losses, damages, or financial outcomes resulting from the use of this platform.
      </p>

      <h2>8. Changes to Terms</h2>
      <p>
        We may update these Terms & Conditions at any time. Continued use of the platform means you accept the updated terms.
      </p>

      <h2>9. Contact</h2>
      <p>
        For any questions, contact us at placedashai@gmail.com
      </p>

      <p style={{ marginTop: "20px", fontSize: "12px", color: "#94a3b8" }}>
        Last updated: {new Date().toLocaleDateString("en-AU")}
      </p>
    </main>
  );
}
