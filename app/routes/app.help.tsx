import { Link } from "react-router";

export default function Help() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: "1.6", color: "#333" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>Help & Support</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>Get answers and support for Fly to Cart Pro</p>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "24px", marginTop: "30px", marginBottom: "15px" }}>Getting Started</h2>

        <div style={{ background: "#f9f9f9", padding: "24px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e8e8e8" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 12px 0" }}>1. Create an Animation</h3>
          <ol style={{ margin: 0, paddingLeft: "20px" }}>
            <li style={{ marginBottom: "8px" }}>Go to <strong>Configure</strong> in the app nav</li>
            <li style={{ marginBottom: "8px" }}>Pick an animation style (Slide In, Bounce, Flip, Pulse, or Spiral)</li>
            <li style={{ marginBottom: "8px" }}>Pick a sound effect (Chime, Whoosh, Pop, Bell, or Sparkle)</li>
            <li style={{ marginBottom: "8px" }}>Click the preview box to hear and see the combination</li>
            <li style={{ marginBottom: "8px" }}>Click <strong>Add to My Animations</strong> to save it</li>
          </ol>
        </div>

        <div style={{ background: "#f9f9f9", padding: "24px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e8e8e8" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 12px 0" }}>2. Set an Animation Live</h3>
          <ol style={{ margin: 0, paddingLeft: "20px" }}>
            <li style={{ marginBottom: "8px" }}>Go to <strong>My Animations</strong> in the app nav</li>
            <li style={{ marginBottom: "8px" }}>Find the combination you want to activate</li>
            <li style={{ marginBottom: "8px" }}>Click <strong>Set Live</strong> — only one animation can be live at a time</li>
            <li style={{ marginBottom: "8px" }}>Click <strong>Stop</strong> any time to deactivate</li>
          </ol>
        </div>

        <div style={{ background: "#f9f9f9", padding: "24px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e8e8e8" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 12px 0" }}>3. Enable the App Embed</h3>
          <ol style={{ margin: 0, paddingLeft: "20px" }}>
            <li style={{ marginBottom: "8px" }}>From the Home page, click <strong>Add to Theme</strong></li>
            <li style={{ marginBottom: "8px" }}>This opens the Shopify theme editor at the App Embeds section</li>
            <li style={{ marginBottom: "8px" }}>Toggle <strong>Fly to Cart Pro</strong> on and click Save</li>
            <li style={{ marginBottom: "8px" }}>The animation and sound will now fire on your storefront when customers click Add to Cart</li>
          </ol>
        </div>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "24px", marginTop: "30px", marginBottom: "20px" }}>Frequently Asked Questions</h2>

        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>How does the animation trigger on my store?</h3>
          <p style={{ margin: 0, color: "#666" }}>The app embed injects a small script that listens for clicks on any "Add to Cart" button. When triggered, it plays the selected animation and sound — no theme code changes needed.</p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Can I have multiple animations saved?</h3>
          <p style={{ margin: 0, color: "#666" }}>Yes. You can save as many animation/sound combinations as you like in My Animations. Only one can be set live at a time.</p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Will the animation slow down my store?</h3>
          <p style={{ margin: 0, color: "#666" }}>No. The app embed uses zero external libraries. All animations run via the native Web Animations API, which is GPU-accelerated and adds no extra network requests to your storefront.</p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Are all animations available on all plans?</h3>
          <p style={{ margin: 0, color: "#666" }}>Yes. The Pro plan gives you full access to every animation and sound with no restrictions. Just subscribe and use everything.</p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>What happens to my data if I uninstall?</h3>
          <p style={{ margin: 0, color: "#666" }}>Animation configurations are stored as shop metafields inside Shopify's infrastructure. They are automatically removed within 30 days of uninstalling the app.</p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>The animation doesn't fire — what should I check?</h3>
          <p style={{ margin: 0, color: "#666" }}>Make sure: (1) An animation is set to Live in My Animations, (2) the App Embed is toggled on in your theme editor, and (3) you've saved the theme editor after enabling it.</p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Is my data secure?</h3>
          <p style={{ margin: 0, color: "#666" }}>Yes. All data is stored within Shopify's infrastructure using TLS/SSL encryption. We do not store any customer personal data or payment information.</p>
        </div>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "24px", marginTop: "30px", marginBottom: "15px" }}>Features</h2>
        <ul style={{ margin: 0, paddingLeft: "20px" }}>
          <li style={{ marginBottom: "12px" }}><strong>5 Animation Styles:</strong> Slide In, Bounce, Flip, Pulse, Spiral</li>
          <li style={{ marginBottom: "12px" }}><strong>5 Sound Effects:</strong> Chime, Whoosh, Pop, Bell, Sparkle</li>
          <li style={{ marginBottom: "12px" }}><strong>Live Preview:</strong> Hear and see the combination before saving</li>
          <li style={{ marginBottom: "12px" }}><strong>One-Click Toggle:</strong> Set any saved animation live or stop it instantly</li>
          <li style={{ marginBottom: "12px" }}><strong>Zero Performance Impact:</strong> Uses native Web Animations API — no external JS libraries</li>
          <li style={{ marginBottom: "12px" }}><strong>Works with Any Theme:</strong> App embed approach requires no theme code changes</li>
          <li style={{ marginBottom: "12px" }}><strong>GDPR & CCPA Compliant:</strong> No customer data collected or stored</li>
        </ul>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "24px", marginTop: "30px", marginBottom: "15px" }}>Contact & Support</h2>
        <div style={{ background: "#f9f9f9", padding: "28px", borderRadius: "8px", border: "1px solid #e8e8e8" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 16px 0" }}>Get Help</h3>
          <div style={{ marginBottom: "16px" }}>
            <p style={{ margin: "0 0 6px 0", fontWeight: 600, color: "#111827" }}>Email</p>
            <p style={{ margin: 0, color: "#666" }}>
              <a href="mailto:hrjobs@nodeagency.co" style={{ color: "#000", textDecoration: "underline" }}>hrjobs@nodeagency.co</a>
            </p>
          </div>
          <div>
            <p style={{ margin: "0 0 6px 0", fontWeight: 600, color: "#111827" }}>Response Time</p>
            <p style={{ margin: 0, color: "#666" }}>We typically respond within 24 business hours.</p>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "24px", marginTop: "30px", marginBottom: "15px" }}>Legal</h2>
        <p style={{ marginBottom: "12px" }}>
          <Link to="/app/privacy" style={{ color: "#000", textDecoration: "underline" }}>Privacy Policy</Link> — Learn how we handle your data
        </p>
        <p style={{ marginBottom: 0 }}>
          <Link to="/app/billing" style={{ color: "#000", textDecoration: "underline" }}>Billing</Link> — Manage your subscription
        </p>
      </section>

      <hr style={{ margin: "40px 0", border: "none", borderTop: "1px solid #ddd" }} />
      <p style={{ color: "#999", fontSize: "14px" }}>Fly to Cart Pro — Making add-to-cart delightful</p>
    </div>
  );
}
