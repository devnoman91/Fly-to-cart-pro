import type { HeadersFunction } from "react-router";
import { Link, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  cardPadding,
  mutedText,
  narrowPageShell,
  secondaryButton,
  sectionTitle,
} from "../styles/ui";

const setupSteps = [
  {
    title: "Create an animation",
    items: [
      "Open Configure from the app navigation.",
      "Choose an animation style and a sound effect.",
      "Preview the combination before saving.",
      "Save it to My Animations.",
    ],
  },
  {
    title: "Set one live",
    items: [
      "Open My Animations.",
      "Find the saved combination you want to use.",
      "Click Set Live. Only one animation can be live at a time.",
    ],
  },
  {
    title: "Enable the app embed",
    items: [
      "Open the Shopify theme editor.",
      "Turn on the Fly to Cart Pro app embed.",
      "Save the theme editor changes.",
    ],
  },
];

const faqs = [
  ["How does the animation trigger?", "The app embed listens for Add to Cart button clicks and plays the selected animation and sound."],
  ["Can I save multiple animations?", "Yes. You can save multiple combinations and set one live at a time."],
  ["Will it slow down my store?", "The storefront script uses native browser APIs and avoids external animation libraries."],
  ["What should I check if it does not fire?", "Confirm an animation is live, the app embed is enabled, and the theme editor changes are saved."],
];

export default function Help() {
  return (
    <s-page heading="Help & Support">
      <div style={narrowPageShell}>
        <div style={{ ...cardPadding, marginBottom: "16px" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: "22px", color: "#111827" }}>Get started quickly</h2>
          <p style={{ ...mutedText, margin: 0 }}>
            Follow the same three-step flow used on the home page: create, set live, then enable the app embed.
          </p>
        </div>

        <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
          {setupSteps.map((step, index) => (
            <section key={step.title} style={cardPadding}>
              <h2 style={sectionTitle}>{index + 1}. {step.title}</h2>
              <ul style={{ margin: "12px 0 0", paddingLeft: "20px", color: "#374151", fontSize: "14px", lineHeight: "1.6" }}>
                {step.items.map((item) => (
                  <li key={item} style={{ marginBottom: "6px" }}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section style={{ ...cardPadding, marginBottom: "16px" }}>
          <h2 style={sectionTitle}>Frequently asked questions</h2>
          <div style={{ display: "grid", gap: "14px", marginTop: "14px" }}>
            {faqs.map(([question, answer]) => (
              <div key={question}>
                <h3 style={{ margin: "0 0 4px", color: "#111827", fontSize: "14px" }}>{question}</h3>
                <p style={{ ...mutedText, margin: 0 }}>{answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...cardPadding, marginBottom: "16px" }}>
          <h2 style={sectionTitle}>Contact support</h2>
          <p style={{ ...mutedText, margin: "0 0 14px" }}>
            Email support for setup, billing, or storefront troubleshooting.
          </p>
          <a href="mailto:hrjobs@nodeagency.co" style={secondaryButton}>
            hrjobs@nodeagency.co
          </a>
        </section>

        <section style={cardPadding}>
          <h2 style={sectionTitle}>Legal</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
            <Link to="/app/privacy" style={secondaryButton}>Privacy Policy</Link>
            <Link to="/app/billing" style={secondaryButton}>Billing</Link>
          </div>
        </section>
      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
