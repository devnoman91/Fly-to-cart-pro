import { cardPadding, mutedText, narrowPageShell, sectionTitle } from "../styles/ui";

const sections = [
  {
    title: "1. Introduction",
    body: "Fly to Cart Pro operates the Fly to Cart Pro Shopify application. This policy describes how data is collected, used, and protected when merchants use the app.",
  },
  {
    title: "2. Information We Collect",
    body: "We store animation configuration data, store information required for app functionality and billing, and OAuth session data required for authentication.",
  },
  {
    title: "3. Information We Do Not Collect",
    body: "We do not collect customer personal data, customer payment information, storefront visitor analytics, advertising identifiers, or behavioral tracking data.",
  },
  {
    title: "4. Purpose of Data Use",
    body: "Data is used to authenticate merchants, save animation settings, serve the selected storefront experience, process Shopify billing, debug issues, and comply with legal obligations.",
  },
  {
    title: "5. Data Storage and Security",
    body: "Animation configuration data is stored in Shopify metafields. Session and subscription records are stored securely for app operation. Data transmission uses TLS/SSL encryption.",
  },
  {
    title: "6. Data Retention",
    body: "Configuration data is retained while the app is installed. After uninstall, app data is removed according to Shopify webhook and retention requirements.",
  },
  {
    title: "7. Your Rights",
    body: "Merchants can request access or deletion by contacting support. Merchants can also uninstall the app at any time from Shopify admin.",
  },
  {
    title: "8. Third-Party Services",
    body: "We do not share app data with advertising or analytics services. App configuration is processed through Shopify infrastructure.",
  },
  {
    title: "9. Contact",
    body: "For privacy questions or data requests, contact hrjobs@nodeagency.co.",
  },
];

export default function Privacy() {
  return (
    <s-page heading="Privacy Policy">
      <div style={narrowPageShell}>
        <div style={{ ...cardPadding, marginBottom: "16px" }}>
          <p style={{ ...mutedText, margin: "0 0 4px" }}>Last updated: May 8, 2026</p>
          <h2 style={{ margin: "0 0 8px", fontSize: "22px", color: "#111827" }}>Fly to Cart Pro privacy practices</h2>
          <p style={{ ...mutedText, margin: 0 }}>
            This app stores only the merchant configuration needed to run add-to-cart animations and sounds.
          </p>
        </div>

        <div style={{ display: "grid", gap: "12px" }}>
          {sections.map((section) => (
            <section key={section.title} style={cardPadding}>
              <h2 style={sectionTitle}>{section.title}</h2>
              <p style={{ ...mutedText, margin: 0, fontSize: "14px" }}>{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </s-page>
  );
}
