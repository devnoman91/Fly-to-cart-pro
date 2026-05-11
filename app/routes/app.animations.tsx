import React from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation, useSubmit, useRouteError } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { fetchConfigurations, saveConfigurations } from "../utils/shopify-graphql";

const ANIMATION_NAMES: Record<string, string> = {
  slide_in: "Slide In",
  bounce: "Bounce",
  flip: "Flip",
  pulse: "Pulse",
  spiral: "Spiral",
};

const SOUND_NAMES: Record<string, string> = {
  chime: "Chime",
  whoosh: "Whoosh",
  pop: "Pop",
  bell: "Bell",
  sparkle: "Sparkle",
};

const ANIMATION_ICON: Record<string, string> = {
  slide_in: "➡️", bounce: "🏀", flip: "🔄", pulse: "💫", spiral: "🌀",
};

const SOUND_ICON: Record<string, string> = {
  chime: "🔔", whoosh: "💨", pop: "🫧", bell: "🛎️", sparkle: "✨",
};

const ANIMATION_DESC: Record<string, string> = {
  slide_in: "Slides the cart icon from the product",
  bounce: "Bouncy spring effect on add to cart",
  flip: "3D flip transition to cart",
  pulse: "Pulsing glow effect",
  spiral: "Spiral path to cart icon",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const configs = await fetchConfigurations(admin);
  return { configs };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") return { success: false };
  const { admin } = await authenticate.admin(request);

  try {
    const formData = await request.formData();
    const _action = formData.get("_action") as string;
    const id = formData.get("id") as string | null;
    const configs = await fetchConfigurations(admin);

    if (_action === "setLive") {
      await saveConfigurations(admin, configs.map((c) => ({ ...c, live: c.id === id })));
    } else if (_action === "stop") {
      await saveConfigurations(admin, configs.map((c) => ({ ...c, live: false })));
    } else if (_action === "delete") {
      await saveConfigurations(admin, configs.filter((c) => c.id !== id));
    }

    return { success: true };
  } catch (err: any) {
    console.error("[FlyToCart] animations action failed:", err?.message);
    return { success: false };
  }
};

export default function MyAnimationsPage() {
  const { configs } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isBusy = navigation.state === "submitting";
  const liveConfig = configs.find((c) => c.live);

  const doAction = (data: Record<string, string>) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, v));
    submit(fd, { method: "POST" });
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #000",
    borderRadius: "8px",
    padding: "24px",
    marginBottom: "24px",
  };

  const btnPrimary: React.CSSProperties = {
    padding: "0px 12px",
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    minHeight: "31px",
    textDecoration: "none",
  };

  const btnDanger: React.CSSProperties = {
    ...btnPrimary,
    backgroundColor: "transparent",
    color: "#cc0000",
    border: "1px solid #cc0000",
  };

  const btnOutlineBlack: React.CSSProperties = {
    ...btnPrimary,
    backgroundColor: "transparent",
    color: "#000",
    border: "1px solid #000",
  };

  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh" }}>
      <div style={{ padding: "40px 30px", minHeight: "100vh", maxWidth: "914px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ margin: "0 0 4px 0", fontSize: "24px", fontWeight: "600", color: "#000" }}>
              My Animations
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: "#555", fontWeight: "300" }}>
              {configs.length} configuration{configs.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <button
            style={btnPrimary}
            onClick={() => (window.location.href = "/app/configure")}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#333"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#000"; }}
          >
            + Add New
          </button>
        </div>

        {/* Live Status Card */}
        <div
          style={{
            ...cardStyle,
            backgroundColor: liveConfig ? "#f9f9f9" : "#f9f9f9",
            borderColor: liveConfig ? "#000" : "#000",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: liveConfig ? "#000" : "#e8e8e8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                }}
              >
                {liveConfig ? ANIMATION_ICON[liveConfig.animationKey] : "⚪"}
              </div>
              {liveConfig && (
                <>
                  <style>{`
                    @keyframes liveping {
                      0% { transform: scale(1); opacity: 0.6; }
                      100% { transform: scale(1.7); opacity: 0; }
                    }
                    .live-ping {
                      animation: liveping 1.4s ease-out infinite;
                    }
                  `}</style>
                  <div
                    className="live-ping"
                    style={{
                      position: "absolute",
                      bottom: "1px",
                      right: "1px",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: "#28a745",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "1px",
                      right: "1px",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: "#28a745",
                    }}
                  />
                </>
              )}
            </div>

            <div style={{ flex: 1, minWidth: "160px" }}>
              {liveConfig ? (
                <>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#000", marginBottom: "3px" }}>
                    {ANIMATION_NAMES[liveConfig.animationKey]} + {SOUND_NAMES[liveConfig.soundKey]}
                  </div>
                  <div style={{ fontSize: "12px", color: "#28a745", fontWeight: "500", display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#28a745" }} />
                    Live on your store
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#000", marginBottom: "3px" }}>
                    No animation live
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", fontWeight: "400" }}>
                    Set one live below to activate on your store
                  </div>
                </>
              )}
            </div>

            {liveConfig && (
              <button
                disabled={isBusy}
                style={btnDanger}
                onClick={() => doAction({ _action: "stop" })}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#fff0f0"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              >
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Animations List */}
        {configs.length === 0 ? (
          <div style={{ ...cardStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "280px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎬</div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600", color: "#000" }}>
              No animations yet
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#888", maxWidth: "280px", lineHeight: "1.5" }}>
              Create your first animation and sound combination to get started.
            </p>
            <button
              style={btnPrimary}
              onClick={() => (window.location.href = "/app/configure")}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#333"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#000"; }}
            >
              + Create Animation
            </button>
          </div>
        ) : (
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #000" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "500", color: "#000" }}>
                Saved Configurations
              </h3>
              <span style={{ fontSize: "12px", color: "#888" }}>
                {configs.filter((c) => c.live).length > 0 ? "1 live" : "0 live"} · {configs.length} total
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {configs.map((cfg) => (
                <div
                  key={cfg.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "16px",
                    borderRadius: "8px",
                    border: cfg.live ? "1.5px solid #000" : "1px solid #e8e8e8",
                    background: cfg.live ? "#f9f9f9" : "#fff",
                    transition: "border-color 0.2s, background 0.2s",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Animation icon */}
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "8px",
                      backgroundColor: cfg.live ? "#000" : "#f0f0f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      flexShrink: 0,
                    }}
                  >
                    {ANIMATION_ICON[cfg.animationKey]}
                  </div>

                  {/* Labels */}
                  <div style={{ flex: 1, minWidth: "140px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#000", marginBottom: "4px" }}>
                      {ANIMATION_NAMES[cfg.animationKey] ?? cfg.animationKey}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{ANIMATION_DESC[cfg.animationKey]}</span>
                    </div>
                  </div>

                  {/* Sound badge */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "5px 10px",
                      borderRadius: "20px",
                      background: "#f0f0f0",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#333",
                      flexShrink: 0,
                    }}
                  >
                    {SOUND_ICON[cfg.soundKey]}
                    <span>{SOUND_NAMES[cfg.soundKey] ?? cfg.soundKey}</span>
                  </div>

                  {/* Status badge */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "5px 12px",
                      borderRadius: "20px",
                      background: cfg.live ? "#000" : "#f4f4f4",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: cfg.live ? "#fff" : "#888",
                      flexShrink: 0,
                      minWidth: "70px",
                      justifyContent: "center",
                    }}
                  >
                    {cfg.live ? (
                      <>
                        <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#28a745" }} />
                        Live
                      </>
                    ) : (
                      "Stopped"
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    {!cfg.live && (
                      <button
                        disabled={isBusy}
                        style={btnPrimary}
                        onClick={() => doAction({ _action: "setLive", id: cfg.id })}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#333"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#000"; }}
                      >
                        Set Live
                      </button>
                    )}
                    {cfg.live && (
                      <button
                        disabled={isBusy}
                        style={btnOutlineBlack}
                        onClick={() => doAction({ _action: "stop" })}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#f0f0f0"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                      >
                        Stop
                      </button>
                    )}
                    <button
                      disabled={isBusy}
                      style={btnDanger}
                      onClick={() => doAction({ _action: "delete", id: cfg.id })}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#fff0f0"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs: any) => boundary.headers(headersArgs);
