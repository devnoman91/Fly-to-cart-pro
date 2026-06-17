import React from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useLoaderData, useActionData, useRouteError, redirect } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { getCurrentPlan, requestPlan, cancelPlan } from "../services/billing.server";
import { card, mutedText, narrowPageShell, sectionTitle } from "../styles/ui";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const subscription = await getCurrentPlan(request);

  // After successful subscription, send merchant into the app
  const url = new URL(request.url);
  if (url.searchParams.get("subscribed") === "1" && (subscription.status === "active" || subscription.status === "pending")) {
    throw redirect("/app");
  }

  return { subscription };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") return null;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "subscribe") {
    try {
      return await requestPlan(request);
    } catch (err: unknown) {
      if (err instanceof Response) throw err;
      if (getErrorMessage(err, "") === "BILLING_UNAVAILABLE") {
        return { error: "Billing is not available yet. Set your app to Public distribution in the Shopify Partner Dashboard first." };
      }
      return { error: getErrorMessage(err, "Failed to start subscription.") };
    }
  }

  if (intent === "cancel") {
    try {
      await cancelPlan(request);
      return { success: "Subscription cancelled." };
    } catch (err: unknown) {
      return { error: getErrorMessage(err, "Failed to cancel.") };
    }
  }

  return null;
};

export default function BillingPage() {
  const { subscription } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

  const isActive = subscription?.status === "active" || subscription?.status === "pending";
  const billingUnavailable = subscription?.billingUnavailable === true;

  const getTrialDaysRemaining = () => {
    if (!subscription?.trialEndsAt) return null;
    const days = Math.ceil(
      (new Date(subscription.trialEndsAt).getTime() - Date.now()) / 86400000
    );
    return Math.max(0, days);
  };

  const formatDate = (d: Date | string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) : null;

  const trialDaysLeft = getTrialDaysRemaining();
  const trialProgress = trialDaysLeft === null ? 100 : Math.min(((14 - trialDaysLeft) / 14) * 100, 100);

  const features = [
    "All 8 animation styles (Slide In, Bounce, Flip, Pulse, Spiral)",
    "All 8 sound effects (Chime, Whoosh, Pop, Bell, Sparkle)",
    "Unlimited animation saves",
    "One-click live/stop toggle",
    "App embed for any Shopify theme",
    "Priority support",
  ];

  const faqs = [
    {
      q: "Will I be charged during the 14-day trial?",
      a: "No. You get full access for 14 days completely free. If you cancel before the trial ends, you will not be charged.",
    },
    {
      q: "Are there any feature restrictions?",
      a: "None. Every animation, sound, and feature is fully available. Just pay $3/month and use everything.",
    },
    {
      q: "What happens if I uninstall the app?",
      a: "Your subscription is cancelled automatically. All animation data stored in your shop metafields is cleaned up within 30 days.",
    },
    {
      q: "Can I cancel any time?",
      a: "Yes. Cancel from this page any time. Shopify will prorate any unused days.",
    },
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
    <s-page heading="Billing">
      <div style={narrowPageShell}>

        {/* Header */}
        <div style={{ marginBottom: "18px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 750, color: "#111827", margin: "0 0 6px" }}>
            Fly to Cart Pro
          </h1>
          <p style={{ ...mutedText, margin: 0 }}>
            One plan. Every feature. $3&nbsp;/&nbsp;month.
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

        {/* Trial banner */}
        {isActive && (
          <div style={{ ...cardStyle, marginBottom: "16px", background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              {trialDaysLeft !== null && trialDaysLeft > 0 ? (
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700 }}>
                    Trial active — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
                    Trial ends: {formatDate(subscription?.trialEndsAt)}
                  </p>
                </div>
              ) : (
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700 }}>Subscription active</h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
                    {subscription?.billingOn
                      ? `Next billing: ${formatDate(subscription.billingOn)}`
                      : "Pro plan approved and active through Shopify."}
                  </p>
                </div>
              )}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", background: "#111827", borderRadius: "20px", color: "#fff", fontSize: "12px", fontWeight: 600 }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#28a745", display: "inline-block" }} />
                Active
              </div>
            </div>
            {trialDaysLeft !== null && trialDaysLeft > 0 && (
              <div style={{ background: "#e0e0e0", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                <div style={{ background: "#111827", height: "100%", width: `${trialProgress}%`, transition: "width 0.3s" }} />
              </div>
            )}
          </div>
        )}

        {/* Plan card */}
        <div style={{ ...cardStyle, marginBottom: "16px", borderWidth: isActive ? "2px" : "1px", borderColor: isActive ? "#111827" : "#d7d7d7" }}>
          {isActive && (
            <div style={{ display: "inline-block", padding: "4px 12px", background: "#111827", borderRadius: "20px", color: "#fff", fontSize: "11px", fontWeight: 700, marginBottom: "16px" }}>
              CURRENT PLAN
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
            <div>
              <h2 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: 750, color: "#111827" }}>Pro</h2>
              <p style={{ ...mutedText, margin: 0 }}>
                {isActive ? "Your Pro plan is active. Full access is enabled." : "Full access. No restrictions."}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "36px", fontWeight: 800, color: "#000" }}>$3</span>
              <span style={{ fontSize: "14px", color: "#999" }}> / month</span>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #e8e8e8", paddingTop: "20px", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#333" }}>
                <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#111827", color: "#fff", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✓</span>
                {f}
              </div>
            ))}
          </div>

          {actionData && "error" in actionData && actionData.error && (
            <p style={{ color: "#cc0000", fontSize: "13px", marginBottom: "12px" }}>{actionData.error}</p>
          )}
          {actionData && "success" in actionData && actionData.success && (
            <p style={{ color: "#28a745", fontSize: "13px", marginBottom: "12px" }}>{actionData.success}</p>
          )}

          {isActive ? (
            <Form method="post">
              <input type="hidden" name="intent" value="cancel" />
              <button type="submit" style={{ ...btnStyle, background: "transparent", color: "#cc0000", border: "1px solid #cc0000" }}>
                Cancel Subscription
              </button>
            </Form>
          ) : (
            <Form method="post">
              <input type="hidden" name="intent" value="subscribe" />
              <button
                type="submit"
                disabled={billingUnavailable}
                style={{ ...btnStyle, opacity: billingUnavailable ? 0.4 : 1, cursor: billingUnavailable ? "not-allowed" : "pointer" }}
              >
                Start 14-Day Free Trial
              </button>
              <p style={{ textAlign: "center", fontSize: "12px", color: "#888", margin: "10px 0 0 0" }}>
                {billingUnavailable ? "Set app to public distribution first" : "No credit card charged during trial"}
              </p>
            </Form>
          )}
        </div>

        {/* FAQ */}
        <div style={cardStyle}>
          <h3 style={sectionTitle}>
            Frequently Asked Questions
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
          All charges billed in USD via Shopify. Cancel any time.
        </p>
      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
