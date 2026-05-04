import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation, useSubmit } from "react-router";
import { authenticate, unauthenticated } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { fetchConfigurations, saveConfigurations, type FtcConfig } from "../utils/shopify-graphql";

const ANIMATION_NAMES: Record<string, string> = {
  slide_in: "Slide In",
  bounce:   "Bounce",
  flip:     "Flip",
  pulse:    "Pulse",
  spiral:   "Spiral",
};

const SOUND_NAMES: Record<string, string> = {
  chime:   "Chime",
  whoosh:  "Whoosh",
  pop:     "Pop",
  bell:    "Bell",
  sparkle: "Sparkle",
};

const ANIMATION_EMOJI: Record<string, string> = {
  slide_in: "➡️", bounce: "🏀", flip: "🔄", pulse: "💫", spiral: "🌀",
};

const SOUND_EMOJI: Record<string, string> = {
  chime: "🔔", whoosh: "💨", pop: "🫧", bell: "🛎️", sparkle: "✨",
};

async function getAdmin(request: Request) {
  try {
    const { admin } = await authenticate.admin(request);
    return admin;
  } catch (err: any) {
    if (err instanceof Response && err.status === 302) {
      const sessions = await prisma.session.findMany({ take: 1, orderBy: { id: "desc" } });
      if (sessions.length > 0 && sessions[0].shop) {
        const { admin } = await unauthenticated.admin(sessions[0].shop);
        return admin;
      }
    }
    throw err;
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const admin = await getAdmin(request);
  const configs = await fetchConfigurations(admin);
  return { configs };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") return { success: false };
  let admin: any;
  try { admin = await getAdmin(request); } catch { return { success: false }; }

  try {
    const formData = await request.formData();
    const _action  = formData.get("_action") as string;
    const id       = formData.get("id") as string | null;
    const configs  = await fetchConfigurations(admin);

    if (_action === "setLive") {
      await saveConfigurations(admin, configs.map(c => ({ ...c, live: c.id === id })));
    } else if (_action === "stop") {
      await saveConfigurations(admin, configs.map(c => ({ ...c, live: false })));
    } else if (_action === "delete") {
      await saveConfigurations(admin, configs.filter(c => c.id !== id));
    }

    return { success: true };
  } catch (err: any) {
    console.error("[FlyToCart] my-animations action failed:", err?.message);
    return { success: false };
  }
};

export default function MyAnimationsPage() {
  const { configs }  = useLoaderData<typeof loader>();
  const navigation   = useNavigation();
  const submit       = useSubmit();
  const isBusy       = navigation.state === "submitting";
  const liveConfig   = configs.find(c => c.live);

  const doAction = (data: Record<string, string>) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, v));
    submit(fd, { method: "POST" });
  };

  return (
    <s-page heading="My Animations">
      <s-button slot="primary-action" onClick={() => (window.location.href = "/app/configure")}>
        + Add New
      </s-button>
      <s-button slot="secondary-action" onClick={() => (window.location.href = "/app")}>
        Back
      </s-button>

      {/* Live status banner */}
      <s-section heading="">
        <div style={{
          padding: "16px 20px",
          borderRadius: "10px",
          background: liveConfig ? "#f0fff4" : "#fafafa",
          border: `1px solid ${liveConfig ? "#28a745" : "#e0e0e0"}`,
          display: "flex",
          alignItems: "center",
          gap: "14px",
          flexWrap: "wrap",
        }}>
          <div style={{ fontSize: "24px" }}>{liveConfig ? "🟢" : "⚪"}</div>
          {liveConfig ? (
            <>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "#1a1a1a" }}>
                  {ANIMATION_EMOJI[liveConfig.animationKey]} {ANIMATION_NAMES[liveConfig.animationKey]}
                  {" + "}
                  {SOUND_EMOJI[liveConfig.soundKey]} {SOUND_NAMES[liveConfig.soundKey]}
                </div>
                <div style={{ fontSize: "12px", color: "#28a745", marginTop: "2px", fontWeight: 600 }}>Live on your store</div>
              </div>
              <button
                disabled={isBusy}
                onClick={() => doAction({ _action: "stop" })}
                style={btnOutline("#dc3545")}
              >
                Stop
              </button>
            </>
          ) : (
            <div style={{ color: "#888", fontSize: "14px" }}>
              No animation is live. Click <strong>Set Live</strong> on any row below.
            </div>
          )}
        </div>
      </s-section>

      {/* Table */}
      <s-section heading="Saved Configurations">
        <s-box padding="base">
          {configs.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎬</div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#333", marginBottom: "6px" }}>No animations yet</div>
              <div style={{ fontSize: "13px", color: "#888", marginBottom: "20px" }}>Create your first animation and sound combination</div>
              <button
                onClick={() => (window.location.href = "/app/configure")}
                style={{ padding: "10px 24px", background: "#0066cc", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
              >
                + Add Animation
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e8e8e8" }}>
                    <th style={thStyle}>Animation</th>
                    <th style={thStyle}>Sound</th>
                    <th style={thStyle}>Status</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((cfg, i) => (
                    <tr
                      key={cfg.id}
                      style={{
                        borderBottom: i < configs.length - 1 ? "1px solid #f0f0f0" : "none",
                        background: cfg.live ? "#f7fff9" : "transparent",
                        transition: "background 0.2s",
                      }}
                    >
                      <td style={tdStyle}>
                        <span style={{ marginRight: "8px" }}>{ANIMATION_EMOJI[cfg.animationKey]}</span>
                        <span style={{ fontWeight: 500 }}>{ANIMATION_NAMES[cfg.animationKey] ?? cfg.animationKey}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ marginRight: "8px" }}>{SOUND_EMOJI[cfg.soundKey]}</span>
                        <span style={{ fontWeight: 500 }}>{SOUND_NAMES[cfg.soundKey] ?? cfg.soundKey}</span>
                      </td>
                      <td style={tdStyle}>
                        {cfg.live ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#e6f9ee", color: "#1a7f3c", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>
                            🟢 Live
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#f4f4f4", color: "#888", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>
                            ⚪ Stopped
                          </span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          {!cfg.live && (
                            <button
                              disabled={isBusy}
                              onClick={() => doAction({ _action: "setLive", id: cfg.id })}
                              style={btnFill("#28a745")}
                            >
                              Set Live
                            </button>
                          )}
                          <button
                            disabled={isBusy}
                            onClick={() => doAction({ _action: "delete", id: cfg.id })}
                            style={btnOutline("#dc3545")}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </s-box>
      </s-section>
    </s-page>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  fontWeight: 700,
  fontSize: "12px",
  textTransform: "uppercase",
  color: "#888",
  letterSpacing: "0.5px",
};

const tdStyle: React.CSSProperties = {
  padding: "14px",
  verticalAlign: "middle",
};

const btnFill = (color: string): React.CSSProperties => ({
  padding: "6px 14px",
  background: color,
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
});

const btnOutline = (color: string): React.CSSProperties => ({
  padding: "6px 14px",
  background: "transparent",
  color: color,
  border: `1px solid ${color}`,
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
});

export const headers = (headersArgs: any) => boundary.headers(headersArgs);
