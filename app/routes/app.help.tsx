import type { HeadersFunction } from "react-router";
import { Link, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useT } from "../i18n/context";
import {
  cardPadding,
  mutedText,
  narrowPageShell,
  secondaryButton,
  sectionTitle,
} from "../styles/ui";

export default function Help() {
  const t = useT();

  const setupSteps = [
    { title: t("help.step1.title"), items: [t("help.step1.i1"), t("help.step1.i2"), t("help.step1.i3"), t("help.step1.i4")] },
    { title: t("help.step2.title"), items: [t("help.step2.i1"), t("help.step2.i2"), t("help.step2.i3")] },
    { title: t("help.step3.title"), items: [t("help.step3.i1"), t("help.step3.i2"), t("help.step3.i3")] },
  ];

  const faqs: [string, string][] = [
    [t("help.faq.q1"), t("help.faq.a1")],
    [t("help.faq.q2"), t("help.faq.a2")],
    [t("help.faq.q3"), t("help.faq.a3")],
    [t("help.faq.q4"), t("help.faq.a4")],
  ];

  return (
    <s-page heading={t("help.pageHeading")}>
      <div style={narrowPageShell}>
        <div style={{ ...cardPadding, marginBottom: "16px" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: "22px", color: "#111827" }}>{t("help.start.title")}</h2>
          <p style={{ ...mutedText, margin: 0 }}>
            {t("help.start.desc")}
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
          <h2 style={sectionTitle}>{t("help.faq.title")}</h2>
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
          <h2 style={sectionTitle}>{t("help.contact.title")}</h2>
          <p style={{ ...mutedText, margin: "0 0 14px" }}>
            {t("help.contact.desc")}
          </p>
          <a href="mailto:hrjobs@nodeagency.co" style={secondaryButton}>
            hrjobs@nodeagency.co
          </a>
        </section>

        <section style={cardPadding}>
          <h2 style={sectionTitle}>{t("help.legal.title")}</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
            <Link to="/app/privacy" style={secondaryButton}>{t("help.legal.privacy")}</Link>
            <Link to="/app/billing" style={secondaryButton}>{t("help.legal.billing")}</Link>
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
