import type { HeadersFunction } from "react-router";
import { useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useT } from "../i18n/context";
import { cardPadding, mutedText, narrowPageShell, sectionTitle } from "../styles/ui";

export default function Privacy() {
  const t = useT();

  const sections = [
    { title: t("privacy.s1.title"), body: t("privacy.s1.body") },
    { title: t("privacy.s2.title"), body: t("privacy.s2.body") },
    { title: t("privacy.s3.title"), body: t("privacy.s3.body") },
    { title: t("privacy.s4.title"), body: t("privacy.s4.body") },
    { title: t("privacy.s5.title"), body: t("privacy.s5.body") },
    { title: t("privacy.s6.title"), body: t("privacy.s6.body") },
    { title: t("privacy.s7.title"), body: t("privacy.s7.body") },
    { title: t("privacy.s8.title"), body: t("privacy.s8.body") },
    { title: t("privacy.s9.title"), body: t("privacy.s9.body") },
  ];

  return (
    <s-page heading={t("privacy.pageHeading")}>
      <div style={narrowPageShell}>
        <div style={{ ...cardPadding, marginBottom: "16px" }}>
          <p style={{ ...mutedText, margin: "0 0 4px" }}>{t("privacy.updated")}</p>
          <h2 style={{ margin: "0 0 8px", fontSize: "22px", color: "#111827" }}>{t("privacy.title")}</h2>
          <p style={{ ...mutedText, margin: 0 }}>
            {t("privacy.intro")}
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

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
