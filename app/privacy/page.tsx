export default function PrivacyPage() {
  return (
    <main style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Privacy Policy</h1>

      <p>
        At PlaceDash AI, we respect your privacy and are committed to protecting your personal information.
      </p>

      <h2>Information We Collect</h2>
      <p>We may collect your email address and usage data when you interact with our platform.</p>

      <h2>How We Use Information</h2>
      <p>We use this information to improve our services and provide AI-generated racing insights.</p>

      <h2>Data Security</h2>
      <p>We take reasonable steps to protect your information.</p>

      <h2>Third Parties</h2>
      <p>We may use third-party services such as Stripe for payments.</p>

      <h2>Contact</h2>
      <p>For any questions, contact us at placedashai@gmail.com</p>
      <p style={{ marginTop: "20px", fontSize: "12px", color: "#94a3b8" }}>
  Last updated: {new Date().toLocaleDateString("en-AU")}
</p>
    </main>
  );
}
