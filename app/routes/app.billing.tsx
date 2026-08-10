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
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "subscribe") {
    const plan = String(formData.get("plan") || "");
    try {
      return await requestPlan(request, plan);
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

type PlanCard = {
  key: string;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  highlight?: boolean;
};

const PLANS: PlanCard[] = [
  {
    key: "pro", // matches PLAN_BASIC — do not change
    name: "Basic",
    price: 5,
    tagline: "An animation and a sound together on every add to cart.",
    features: [
      "All 8 animation styles",
      "All 8 sound effects",
      "Animation + sound together",
      "Unlimited saved effects",
      "One-click live / stop toggle",
      "App embed for any theme",
    ],
  },
  {
    key: "premium", // matches PLAN_PREMIUM
    name: "Premium",
    price: 10,
    tagline: "Everything in Basic, plus flexible effects and custom branding.",
    features: [
      "Everything in Basic",
      "Animation-only effects",
      "Sound-only effects",
      "Custom logo in the flying bubble",
      "Custom bubble background color",
      "Priority support",
    ],
    highlight: true,
  },
];

export default function BillingPage() {
  const { subscription, trialEndsAt, trialExpired } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

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
    {
      q: "How does the 14-day free trial work?",
      a: "You get full Premium access for 14 days from the moment you install — no card required, nothing to click. Before it ends, pick the plan that fits your store.",
    },
    {
      q: "What's the difference between Basic and Premium?",
      a: "Basic ($5/mo) plays an animation and a sound together on add to cart. Premium ($10/mo) adds animation-only and sound-only effects plus custom branding — your logo in the flying bubble and a custom bubble color.",
    },
    {
      q: "Can I switch plans later?",
      a: "Yes. Upgrade or downgrade any time from this page — Shopify swaps the subscription and prorates the difference automatically.",
    },
    {
      q: "What happens if I uninstall the app?",
      a: "Your subscription is cancelled automatically. All animation data stored in your shop metafields is cleaned up within 30 days.",
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
            Two plans. Start at $5&nbsp;/&nbsp;month, or unlock single-mode effects and
            branding with Premium at $10&nbsp;/&nbsp;month.
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
                    {currentPlanKey === "premium" ? "Premium plan active" : "Basic plan active"}
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
                    {subscription?.billingOn
                      ? `Next billing: ${formatDate(subscription.billingOn)}`
                      : "Active through Shopify."}
                  </p>
                </div>
              ) : (
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700 }}>
                    Free trial — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
                    Trial ends: {formatDate(trialEndsAt)}
                  </p>
                </div>
              )}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", background: "#111827", borderRadius: "20px", color: "#fff", fontSize: "12px", fontWeight: 600 }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#28a745", display: "inline-block" }} />
                {isActive ? "Active" : "Trial"}
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
            const switchLabel = plan.key === "premium" ? "Upgrade to Premium" : "Switch to Basic";
            const buttonLabel = isActive ? switchLabel : `Subscribe — $${plan.price} / month`;
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
                      CURRENT PLAN
                    </span>
                  )}
                  {!isCurrent && plan.highlight && (
                    <span style={{ display: "inline-block", padding: "4px 12px", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "20px", color: "#4338ca", fontSize: "11px", fontWeight: 700 }}>
                      MOST FLEXIBLE
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
                    <span style={{ fontSize: "13px", color: "#999" }}> / mo</span>
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
                      Cancel Subscription
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
                        ? "Set app to public distribution first"
                        : isActive
                        ? "Shopify swaps your plan and prorates the difference"
                        : trialExpired
                        ? "Your 14-day trial has ended"
                        : `Full access during trial — ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} left`}
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
