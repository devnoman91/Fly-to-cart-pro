import React from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { fetchConfigurations } from "../utils/shopify-graphql";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const configs = await fetchConfigurations(admin);
  const liveConfig = configs.find((c) => c.live) ?? null;
  return { liveConfig, totalCount: configs.length, shop: session?.shop };
};

const ANIMATION_NAMES: Record<string, string> = {
  slide_in: "Slide In", bounce: "Bounce", flip: "Flip", pulse: "Pulse", spiral: "Spiral",
  zoom: "Zoom", shake: "Shake", float: "Float",
};
const SOUND_NAMES: Record<string, string> = {
  chime: "Chime", whoosh: "Whoosh", pop: "Pop", bell: "Bell", sparkle: "Sparkle",
  coin: "Coin", laser: "Laser", drum: "Drum",
};

export default function Index() {
  const { liveConfig, totalCount, shop } = useLoaderData<typeof loader>();

  const hasConfigs = totalCount > 0;
  const isLive = !!liveConfig;

  const API_KEY = "9620563a9ea6bc8e3f91ec87e893f4e8";
  const EMBED_HANDLE = "add-to-cart";
  const appEmbedDeepLink = `https://${shop}/admin/themes/current/editor?context=apps&activateAppId=${API_KEY}/${EMBED_HANDLE}`;

  const [showOnboarding, setShowOnboarding] = React.useState(true);

  const steps = [
    {
      num: 1,
      done: hasConfigs,
      title: "Create an animation",
      desc: "Pick an animation style and a sound, then preview the combination.",
      href: "/app/configure",
      btnLabel: "Go to Configure",
    },
    {
      num: 2,
      done: isLive,
      title: "Set it live",
      desc: "Open My Animations, find your combination and click Set Live.",
      href: "/app/animations",
      btnLabel: "My Animations",
    },
    {
      num: 3,
      done: false,
      title: "Enable app embed",
      desc: "In Shopify theme editor → App Embeds → turn on Fly-to-Cart Pro.",
      href: appEmbedDeepLink,
      btnLabel: "Add to Theme",
      external: true,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #000",
    borderRadius: "8px",
    padding: "24px",
    marginBottom: "24px",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "0px 12px",
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "400",
    textDecoration: "none",
    cursor: "pointer",
    transition: "background-color 0.2s",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    minHeight: "31px",
  };

  const closeButtonStyle: React.CSSProperties = {
    background: "#666",
    border: "none",
    fontSize: "10px",
    lineHeight: "1",
    cursor: "pointer",
    color: "white",
    padding: "0",
    width: "19px",
    height: "19px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s",
  };

  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh" }}>
      <div style={{ padding: "40px 30px", minHeight: "100vh", maxWidth: "914px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "15px" }}>
          <h1 style={{ margin: "0", fontSize: "24px", fontWeight: "600", color: "#000" }}>
            Fly to Cart Pro
          </h1>
        </div>

        {/* Status Banner */}
        {showOnboarding && (
          <div style={{ ...cardStyle, backgroundColor: "#f9f9f9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: isLive ? "#28a745" : "#ccc",
                      flexShrink: 0,
                    }}
                  />
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#000" }}>
                    {isLive ? "Live on your store" : "Not yet live"}
                  </h3>
                </div>
                <p style={{ color: "#333", fontSize: "14px", margin: "0 0 12px 0", lineHeight: "1.5" }}>
                  {isLive ? (
                    <>
                      <strong>{ANIMATION_NAMES[liveConfig!.animationKey]}</strong> animation with{" "}
                      <strong>{SOUND_NAMES[liveConfig!.soundKey]}</strong> sound is active on your store.
                    </>
                  ) : hasConfigs ? (
                    <>You have <strong>{totalCount} saved animation{totalCount > 1 ? "s" : ""}</strong> — none are live yet.</>
                  ) : (
                    <>No animation configured yet. Follow the setup guide below to get started.</>
                  )}
                </p>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    style={buttonStyle}
                    onClick={() =>
                      (window.location.href = isLive || hasConfigs ? "/app/animations" : "/app/configure")
                    }
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#333";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#000";
                    }}
                  >
                    {isLive ? "Manage" : hasConfigs ? "Set Live" : "Get Started"}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowOnboarding(false)}
                style={closeButtonStyle}
                aria-label="Dismiss"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#444";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#666";
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Setup Guide */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid #000" }}>
            <div>
              <h3 style={{ margin: "0 0 8px 0", fontWeight: "500", fontSize: "18px", lineHeight: "100%", color: "#000" }}>
                Setup Guide
              </h3>
              <p style={{ fontWeight: "300", fontSize: "14px", lineHeight: "100%", color: "#555", margin: "0" }}>
                {doneCount} of {steps.length} steps complete
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: "4px", background: "#eee", borderRadius: "2px", overflow: "hidden", marginBottom: "20px" }}>
            <div
              style={{
                height: "100%",
                background: "#000",
                borderRadius: "2px",
                width: `${(doneCount / steps.length) * 100}%`,
                transition: "width 0.3s",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {steps.map((step) => (
              <div
                key={step.num}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  padding: "16px",
                  borderRadius: "8px",
                  background: step.done ? "#f9f9f9" : "#fff",
                  border: "1px solid #e8e8e8",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: step.done ? "2px solid #000" : "2px solid #ddd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "700",
                    color: step.done ? "#fff" : "#aaa",
                    background: step.done ? "#000" : "transparent",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  {step.done ? "✓" : step.num}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: step.done ? "#888" : "#000",
                      marginBottom: "4px",
                      textDecoration: step.done ? "line-through" : "none",
                    }}
                  >
                    {step.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", lineHeight: "1.5" }}>
                    {step.desc}
                  </div>
                  {!step.done && step.href && (
                    (step as any).external ? (
                      <a
                        href={step.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...buttonStyle, marginTop: "10px" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "#333";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "#000";
                        }}
                      >
                        {step.btnLabel} →
                      </a>
                    ) : (
                      <button
                        style={{ ...buttonStyle, marginTop: "10px" }}
                        onClick={() => (window.location.href = step.href!)}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "#333";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "#000";
                        }}
                      >
                        {step.btnLabel} →
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Animations */}
        <div style={{ ...cardStyle, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "48px", paddingBottom: "24px", borderBottom: "1px solid #000" }}>
            <div>
              <h3 style={{ margin: "0 0 8px 0", fontWeight: "500", fontSize: "18px", lineHeight: "100%", color: "#000" }}>
                My Animations
              </h3>
              <p style={{ fontWeight: "300", fontSize: "14px", lineHeight: "100%", color: "#555", margin: "0" }}>
                Create & manage animation configurations for your store.
              </p>
            </div>
            <button
              style={buttonStyle}
              onClick={() => (window.location.href = "/app/configure")}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#333";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#000";
              }}
            >
              + Create Animation
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px", gap: "24px" }}>
            {hasConfigs ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: "300", fontSize: "14px", lineHeight: "100%", color: "#000", margin: "0 0 8px 0" }}>
                  You have <strong style={{ fontWeight: "700" }}>{totalCount} animation{totalCount > 1 ? "s" : ""}</strong> saved.
                </p>
                <p style={{ fontWeight: "300", fontSize: "14px", lineHeight: "100%", color: "#000", margin: "0 0 16px 0" }}>
                  {isLive
                    ? <>Currently running: <strong style={{ fontWeight: "700" }}>{ANIMATION_NAMES[liveConfig!.animationKey]} + {SOUND_NAMES[liveConfig!.soundKey]}</strong></>
                    : "None are live yet — go to My Animations to set one live."}
                </p>
                <button
                  style={buttonStyle}
                  onClick={() => (window.location.href = "/app/animations")}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#333";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#000";
                  }}
                >
                  View All Animations
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: "300", fontSize: "14px", lineHeight: "100%", color: "#000", margin: "0 0 8px 0" }}>
                  You don&apos;t have any animations yet.
                </p>
                <p style={{ fontWeight: "300", fontSize: "14px", lineHeight: "100%", color: "#000", margin: "0" }}>
                  Click the <strong style={{ fontWeight: "700" }}>Create Animation</strong> button above to create your first one.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
