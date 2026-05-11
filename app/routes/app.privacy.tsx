export default function Privacy() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: "1.6", color: "#333" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>Privacy Policy</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>Last updated: May 8, 2026</p>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "20px", marginTop: "30px", marginBottom: "15px" }}>1. Introduction</h2>
        <p>Fly to Cart Pro ("we", "us", "our") operates the Fly to Cart Pro Shopify application. This page describes our policies regarding the collection, use, and disclosure of data when you use our Service.</p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "20px", marginTop: "30px", marginBottom: "15px" }}>2. Information We Collect</h2>
        <p><strong>We collect the following:</strong></p>
        <ul style={{ marginLeft: "20px", marginBottom: "15px" }}>
          <li style={{ marginBottom: "10px" }}><strong>Animation Configuration Data:</strong> Your saved animation and sound combinations, stored as Shopify shop metafields</li>
          <li style={{ marginBottom: "10px" }}><strong>Store Information:</strong> Your Shopify store name and domain for app functionality and billing</li>
          <li style={{ marginBottom: "10px" }}><strong>Session Data:</strong> OAuth session tokens stored securely for authentication</li>
        </ul>
        <p><strong>We do NOT collect:</strong></p>
        <ul style={{ marginLeft: "20px" }}>
          <li style={{ marginBottom: "10px" }}>Customer personal data (names, emails, addresses)</li>
          <li style={{ marginBottom: "10px" }}>Customer payment information</li>
          <li style={{ marginBottom: "10px" }}>Any storefront visitor data or analytics</li>
        </ul>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "20px", marginTop: "30px", marginBottom: "15px" }}>3. Purpose of Data Use</h2>
        <ul style={{ marginLeft: "20px" }}>
          <li style={{ marginBottom: "10px" }}>To provide and maintain the Fly to Cart Pro app functionality</li>
          <li style={{ marginBottom: "10px" }}>To save and serve your animation configurations on your storefront</li>
          <li style={{ marginBottom: "10px" }}>To process billing through Shopify's payment infrastructure</li>
          <li style={{ marginBottom: "10px" }}>To debug and improve the app</li>
          <li style={{ marginBottom: "10px" }}>To comply with legal obligations</li>
        </ul>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "20px", marginTop: "30px", marginBottom: "15px" }}>4. Data Storage and Security</h2>
        <p>Animation configuration data is stored within Shopify's metafield infrastructure. Session data is stored in a secure SQLite database. All data transmission is encrypted using TLS/SSL protocols.</p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "20px", marginTop: "30px", marginBottom: "15px" }}>5. Data Retention</h2>
        <p>Configuration data is retained while the app is installed on your store. Upon uninstallation, all animation data is deleted from our systems within 30 days via the SHOP_REDACT webhook.</p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "20px", marginTop: "30px", marginBottom: "15px" }}>6. Your Rights</h2>
        <ul style={{ marginLeft: "20px" }}>
          <li style={{ marginBottom: "10px" }}><strong>Access:</strong> Request a copy of all data we store about your store</li>
          <li style={{ marginBottom: "10px" }}><strong>Deletion:</strong> Request deletion by uninstalling the app or contacting us</li>
          <li style={{ marginBottom: "10px" }}><strong>Opt-out:</strong> Uninstall the app at any time through your Shopify admin</li>
        </ul>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "20px", marginTop: "30px", marginBottom: "15px" }}>7. GDPR & Data Privacy Compliance</h2>
        <p>Fly to Cart Pro complies with GDPR, CCPA, and other applicable data protection laws.</p>
        <ul style={{ marginLeft: "20px" }}>
          <li style={{ marginBottom: "10px" }}>All data processing is performed within the Shopify ecosystem</li>
          <li style={{ marginBottom: "10px" }}>No customer personal data is collected or processed</li>
          <li style={{ marginBottom: "10px" }}>You maintain full control over your data through your Shopify admin</li>
        </ul>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "20px", marginTop: "30px", marginBottom: "15px" }}>8. Third-Party Services</h2>
        <p>We do not share your data with third-party services. All data is processed and stored exclusively through Shopify's infrastructure. No external analytics, advertising, or tracking services are used.</p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "20px", marginTop: "30px", marginBottom: "15px" }}>9. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date.</p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "20px", marginTop: "30px", marginBottom: "15px" }}>10. Contact Us</h2>
        <p>For questions about this Privacy Policy or data requests, contact us at:</p>
        <p style={{ marginTop: "15px" }}>
          <strong>Fly to Cart Pro</strong><br />
          Email: <a href="mailto:hrjobs@nodeagency.co" style={{ color: "#000" }}>hrjobs@nodeagency.co</a>
        </p>
      </section>

      <hr style={{ margin: "40px 0", border: "none", borderTop: "1px solid #ddd" }} />
      <p style={{ color: "#999", fontSize: "14px" }}>This policy is effective as of May 8, 2026.</p>
    </div>
  );
}
