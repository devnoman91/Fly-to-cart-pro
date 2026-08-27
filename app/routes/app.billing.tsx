import React from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useLoaderData, useActionData, useRouteError, redirect } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { getCurrentPlan, requestPlan, cancelPlan } from "../services/billing.server";
import { getServerT } from "../i18n";
import { useT } from "../i18n/context";
import { card, mutedText, narrowPageShell, sectionTitle } from "../styles/ui";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const subscription = await getCurrentPlan(request);

  const url = new URL(request.url);
  if (url.searchParams.get("subscribed") === "1" && (subscription.status === "active" || subscription.status === "pending")) {
    throw redirect("/app");
  }

  const trialEndsAt = subscription.trialEndsAt ?? null;
  const trialExpired = trialEndsAt ? new Date() >= new Date(trialEndsAt) : false;

  return { subscription, trialEndsAt, trialExpired };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") return null;
  const t = getServerT(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "subscribe") {
    const plan = String(formData.get("plan") || "");
    try {
      return await requestPlan(request, plan);
    } catch (err: unknown) {
      if (err instanceof Response) throw err;
      if (getErrorMessage(err, "") === "BILLING_UNAVAILABLE") {
        return { error: t("billing.error.unavailable") };
      }
      return { error: getErrorMessage(err, t("billing.error.subscribeFailed")) };
    }
  }

  if (intent === "cancel") {
    try {
      await cancelPlan(request);
      return { success: t("billing.success.cancelled") };
    } catch (err: unknown) {
      return { error: getErrorMessage(err, t("billing.error.cancelFailed")) };
    }
  }

  return null;
};

type PlanCard = {
  key: string;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  highlight?: boolean;
};

export default function BillingPage() {
  const { subscription, trialEndsAt, trialExpired } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const t = useT();
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

  // Plan keys/prices stay fixed; names, taglines and features are translated.
  const PLANS: PlanCard[] = [
    {
      key: "pro", // matches PLAN_BASIC — do not change
      name: t("billing.basic.name"),
      price: 5,
      tagline: t("billing.basic.tagline"),
      features: [
        t("billing.basic.f1"), t("billing.basic.f2"), t("billing.basic.f3"),
        t("billing.basic.f4"), t("billing.basic.f5"), t("billing.basic.f6"),
      ],
    },
    {
      key: "premium", // matches PLAN_PREMIUM
      name: t("billing.premium.name"),
      price: 10,
      tagline: t("billing.premium.tagline"),
      features: [
        t("billing.premium.f1"), t("billing.premium.f2"), t("billing.premium.f3"),
        t("billing.premium.f4"), t("billing.premium.f5"), t("billing.premium.f6"),
      ],
      highlight: true,
    },
  ];

  const isActive = subscription?.status === "active" || subscription?.status === "pending";
  const billingUnavailable = subscription?.billingUnavailable === true;

  const formatDate = (d: Date | string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) : null;

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.floor((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;
  const trialProgress = trialDaysLeft === null ? 100 : Math.min(((14 - trialDaysLeft) / 14) * 100, 100);

  // The plan a shop is billed on right now (null during trial / when unpaid).
  const currentPlanKey = isActive ? subscription?.planName ?? null : null;

  const faqs = [
    { q: t("billing.faq.q1"), a: t("billing.faq.a1") },
    { q: t("billing.faq.q2"), a: t("billing.faq.a2") },
    { q: t("billing.faq.q3"), a: t("billing.faq.a3") },
    { q: t("billing.faq.q4"), a: t("billing.faq.a4") },
  ];

  const cardStyle: React.CSSProperties = {
    ...card,
    padding: "32px",
  };

  const btnStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <s-page heading={t("billing.pageHeading")}>
      <div style={narrowPageShell}>

        {/* Header */}
        <div style={{ marginBottom: "18px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 750, color: "#111827", margin: "0 0 6px" }}>
            {t("billing.header.title")}
          </h1>
          <p style={{ ...mutedText, margin: 0 }}>
            {t("billing.header.desc")}
          </p>
        </div>

        {/* Partner Dashboard distribution notice */}
        {billingUnavailable && (
          <div style={{ background: "#fff8e1", border: "1px solid #f59e0b", borderRadius: "8px", padding: "16px 20px", marginBottom: "24px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "20px", flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ margin: "0 0 4px 0", fontWeight: 700, fontSize: "14px", color: "#92400e" }}>
                Billing API not available
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#78350f", lineHeight: "1.6" }}>
                Your app must be set to <strong>Public distribution</strong> in the{" "}
                <a href="https://partners.shopify.com" target="_blank" rel="noopener noreferrer" style={{ color: "#92400e" }}>
                  Shopify Partner Dashboard
                </a>{" "}
                before the Billing API is available. Go to your app → <strong>Distribution</strong> → choose <strong>Shopify App Store</strong> or <strong>Custom</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Trial banner — shown while in trial or active subscription */}
        {(isActive || (trialDaysLeft !== null && trialDaysLeft > 0)) && (
          <div style={{ ...cardStyle, marginBottom: "16px", background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              {isActive ? (
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700 }}>
                    {currentPlanKey === "premium" ? t("billing.trial.activeTitlePremium") : t("billing.trial.activeTitleBasic")}
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
                    {subscription?.billingOn
                      ? t("billing.trial.nextBilling", { date: formatDate(subscription.billingOn) ?? "" })
                      : t("billing.trial.activeThrough")}
                  </p>
                </div>
              ) : (
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700 }}>
                    {trialDaysLeft === 1
                      ? t("billing.trial.remainingOne")
                      : t("billing.trial.remainingMany", { days: trialDaysLeft ?? 0 })}
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
                    {t("billing.trial.ends", { date: formatDate(trialEndsAt) ?? "" })}
                  </p>
                </div>
              )}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", background: "#111827", borderRadius: "20px", color: "#fff", fontSize: "12px", fontWeight: 600 }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#28a745", display: "inline-block" }} />
                {isActive ? t("billing.badge.active") : t("billing.badge.trial")}
              </div>
            </div>
            {!isActive && trialDaysLeft !== null && trialDaysLeft > 0 && (
              <div style={{ background: "#e0e0e0", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                <div style={{ background: "#111827", height: "100%", width: `${trialProgress}%`, transition: "width 0.3s" }} />
              </div>
            )}
          </div>
        )}

        {/* Action feedback (shown once above the plan grid) */}
        {actionData && "error" in actionData && actionData.error && (
          <p style={{ color: "#cc0000", fontSize: "13px", marginBottom: "12px" }}>{actionData.error}</p>
        )}
        {actionData && "success" in actionData && actionData.success && (
          <p style={{ color: "#28a745", fontSize: "13px", marginBottom: "12px" }}>{actionData.success}</p>
        )}

        {/* Plan cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
            gap: "16px",
            marginBottom: "16px",
            alignItems: "stretch",
          }}
        >
          {PLANS.map((plan) => {
            const isCurrent = currentPlanKey === plan.key;
            // Label depends on whether the shop is already paying for the OTHER plan.
            const switchLabel = plan.key === "premium" ? t("billing.btn.upgradePremium") : t("billing.btn.switchBasic");
            const buttonLabel = isActive ? switchLabel : t("billing.btn.subscribe", { price: plan.price });
            // Trial no longer blocks choosing a tier — only a missing Billing API does.
            const disabled = billingUnavailable;

            return (
              <div
                key={plan.key}
                style={{
                  ...cardStyle,
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  borderWidth: isCurrent ? "2px" : "1px",
                  borderColor: isCurrent ? "#111827" : plan.highlight ? "#a5b4fc" : "#d7d7d7",
                }}
              >
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px", minHeight: "24px" }}>
                  {isCurrent && (
                    <span style={{ display: "inline-block", padding: "4px 12px", background: "#111827", borderRadius: "20px", color: "#fff", fontSize: "11px", fontWeight: 700 }}>
                      {t("billing.card.current")}
                    </span>
                  )}
                  {!isCurrent && plan.highlight && (
                    <span style={{ display: "inline-block", padding: "4px 12px", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "20px", color: "#4338ca", fontSize: "11px", fontWeight: 700 }}>
                      {t("billing.card.flexible")}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", gap: "12px" }}>
                  <div>
                    <h2 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: 750, color: "#111827" }}>{plan.name}</h2>
                    <p style={{ ...mutedText, margin: 0 }}>{plan.tagline}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{ fontSize: "34px", fontWeight: 800, color: "#000" }}>${plan.price}</span>
                    <span style={{ fontSize: "13px", color: "#999" }}> {t("billing.card.perMonth")}</span>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #e8e8e8", paddingTop: "18px", marginBottom: "22px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#333" }}>
                      <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#111827", color: "#fff", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <Form method="post">
                    <input type="hidden" name="intent" value="cancel" />
                    <button type="submit" style={{ ...btnStyle, background: "transparent", color: "#cc0000", border: "1px solid #cc0000" }}>
                      {t("billing.btn.cancel")}
                    </button>
                  </Form>
                ) : (
                  <Form method="post">
                    <input type="hidden" name="intent" value="subscribe" />
                    <input type="hidden" name="plan" value={plan.key} />
                    <button
                      type="submit"
                      disabled={disabled}
                      style={{ ...btnStyle, opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
                    >
                      {buttonLabel}
                    </button>
                    <p style={{ textAlign: "center", fontSize: "12px", color: "#888", margin: "10px 0 0 0" }}>
                      {billingUnavailable
                        ? t("billing.subnote.publicFirst")
                        : isActive
                        ? t("billing.subnote.swaps")
                        : trialExpired
                        ? t("billing.subnote.trialEnded")
                        : trialDaysLeft === 1
                        ? t("billing.subnote.trialLeftOne")
                        : t("billing.subnote.trialLeftMany", { days: trialDaysLeft ?? 0 })}
                    </p>
                  </Form>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div style={cardStyle}>
          <h3 style={sectionTitle}>
            {t("billing.faq.title")}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: i < faqs.length - 1 ? "1px solid #e8e8e8" : "none", paddingBottom: "16px", marginBottom: "16px" }}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
                >
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#000" }}>{faq.q}</span>
                  <span style={{ fontSize: "18px", color: "#888", flexShrink: 0, marginLeft: "12px" }}>{expandedFaq === i ? "−" : "+"}</span>
                </button>
                {expandedFaq === i && (
                  <p style={{ margin: "10px 0 0 0", fontSize: "13px", color: "#666", lineHeight: "1.6" }}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", color: "#9ca3af", fontSize: "12px" }}>
          {t("billing.footer")}
        </p>
      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
