import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation, useSubmit } from "react-router";
import { useState } from "react";
import { authenticate, unauthenticated } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import {
  fetchConfigurations,
  saveConfigurations,
  type FtcConfig,
} from "../utils/shopify-graphql";

const ANIMATIONS = [
  { key: "slide_in", name: "Slide In" },
  { key: "bounce",   name: "Bounce"   },
  { key: "flip",     name: "Flip"     },
  { key: "pulse",    name: "Pulse"    },
  { key: "spiral",   name: "Spiral"   },
];

const SOUNDS = [
  { key: "chime",   name: "Chime"   },
  { key: "whoosh",  name: "Whoosh"  },
  { key: "pop",     name: "Pop"     },
  { key: "bell",    name: "Bell"    },
  { key: "sparkle", name: "Sparkle" },
];

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
  return { configs, animations: ANIMATIONS, sounds: SOUNDS };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") return { success: false, error: "Invalid method" };

  let admin: any;
  try {
    admin = await getAdmin(request);
  } catch (err: any) {
    return { success: false, error: "Authentication failed", detail: err?.message };
  }

  try {
    const formData = await request.formData();
    const _action = formData.get("_action") as string;
    const configs = await fetchConfigurations(admin);

    if (_action === "add") {
      const animationKey = formData.get("animationKey") as string;
      const soundKey = formData.get("soundKey") as string;
      if (!animationKey || !soundKey) return { success: false, error: "Select both animation and sound" };
      const newConfig: FtcConfig = { id: Date.now().toString(), animationKey, soundKey, live: false };
      const updated = [...configs, newConfig];
      await saveConfigurations(admin, updated);
      console.log(`[FlyToCart] Added config — animation: ${animationKey}, sound: ${soundKey}`);
      return { success: true, error: null };
    }

    if (_action === "setLive") {
      const id = formData.get("id") as string;
      const updated = configs.map((c) => ({ ...c, live: c.id === id }));
      await saveConfigurations(admin, updated);
      console.log(`[FlyToCart] Set live — id: ${id}`);
      return { success: true, error: null };
    }

    if (_action === "stop") {
      const updated = configs.map((c) => ({ ...c, live: false }));
      await saveConfigurations(admin, updated);
      console.log(`[FlyToCart] Stopped all configs`);
      return { success: true, error: null };
    }

    if (_action === "delete") {
      const id = formData.get("id") as string;
      const updated = configs.filter((c) => c.id !== id);
      await saveConfigurations(admin, updated);
      console.log(`[FlyToCart] Deleted config — id: ${id}`);
      return { success: true, error: null };
    }

    return { success: false, error: "Unknown action" };
  } catch (err: any) {
    console.error("[FlyToCart] Action failed:", err?.message);
    return { success: false, error: err?.message || "Action failed" };
  }
};

export default function ConfigurePage() {
  const { configs, animations, sounds } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submit = useSubmit();

  const [selectedAnimation, setSelectedAnimation] = useState(animations[0].key);
  const [selectedSound, setSelectedSound] = useState(sounds[0].key);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const isBusy = navigation.state === "submitting";

  const animName = (key: string) => animations.find((a) => a.key === key)?.name ?? key;
  const sndName  = (key: string) => sounds.find((s) => s.key === key)?.name ?? key;

  const liveConfig = configs.find((c) => c.live);

  const doAction = (data: Record<string, string>) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, v));
    submit(fd, { method: "POST" });
  };

  const playSound = (soundKey: string, id: string) => {
    setPlayingId(id);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const sounds: Record<string, () => void> = {
        chime:   () => [523,659,784].forEach((f,i) => { const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value=f; g.gain.setValueAtTime(0.3,now+i*0.1); g.gain.exponentialRampToValueAtTime(0.01,now+i*0.1+0.2); o.start(now+i*0.1); o.stop(now+i*0.1+0.2); }),
        whoosh:  () => { const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.setValueAtTime(400,now); o.frequency.exponentialRampToValueAtTime(100,now+0.4); g.gain.setValueAtTime(0.3,now); g.gain.exponentialRampToValueAtTime(0.01,now+0.4); o.start(now); o.stop(now+0.4); },
        pop:     () => { const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.setValueAtTime(150,now); o.frequency.exponentialRampToValueAtTime(50,now+0.1); g.gain.setValueAtTime(0.4,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.1); o.start(now); o.stop(now+0.1); },
        bell:    () => { const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value=800; g.gain.setValueAtTime(0.3,now); g.gain.exponentialRampToValueAtTime(0.01,now+0.7); o.start(now); o.stop(now+0.7); },
        sparkle: () => [0,1,2].forEach(i => { const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value=1000+i*300; g.gain.setValueAtTime(0.2,now+i*0.15); g.gain.exponentialRampToValueAtTime(0.01,now+i*0.15+0.15); o.start(now+i*0.15); o.stop(now+i*0.15+0.15); }),
      };
      sounds[soundKey]?.();
    } catch {}
    setTimeout(() => setPlayingId(null), 700);
  };

  return (
    <s-page heading="Fly to Cart — Configurations">
      <s-button slot="primary-action" onClick={() => (window.location.href = "/app")}>
        Back
      </s-button>

      {/* Status bar */}
      <s-section heading="Active Configuration">
        <s-box padding="base">
          {liveConfig ? (
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "20px" }}>🟢</span>
              <div>
                <strong>{animName(liveConfig.animationKey)}</strong> + <strong>{sndName(liveConfig.soundKey)}</strong>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>Live on your store</div>
              </div>
              <button
                disabled={isBusy}
                onClick={() => doAction({ _action: "stop" })}
                style={{ marginLeft: "auto", padding: "6px 16px", background: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                Stop
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>⚪</span>
              <span style={{ color: "#666" }}>No configuration is live. Set one live from the table below.</span>
            </div>
          )}
        </s-box>
      </s-section>

      {/* Configurations table */}
      <s-section heading="Saved Configurations">
        <s-box padding="base">
          {configs.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#888" }}>
              No configurations yet. Add one below.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "#f4f4f4", textAlign: "left" }}>
                    <th style={th}>Animation</th>
                    <th style={th}>Sound</th>
                    <th style={th}>Preview</th>
                    <th style={th}>Status</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((cfg) => (
                    <tr key={cfg.id} style={{ borderBottom: "1px solid #e0e0e0", background: cfg.live ? "#f0fff4" : "#fff" }}>
                      <td style={td}>{animName(cfg.animationKey)}</td>
                      <td style={td}>{sndName(cfg.soundKey)}</td>
                      <td style={td}>
                        <button
                          onClick={() => playSound(cfg.soundKey, cfg.id)}
                          style={{ padding: "4px 10px", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer", background: playingId === cfg.id ? "#e0f0ff" : "#fff" }}
                        >
                          {playingId === cfg.id ? "♪" : "▶ Play"}
                        </button>
                      </td>
                      <td style={td}>
                        {cfg.live ? (
                          <span style={{ color: "#28a745", fontWeight: 600 }}>🟢 Live</span>
                        ) : (
                          <span style={{ color: "#999" }}>⚪ Stopped</span>
                        )}
                      </td>
                      <td style={{ ...td, display: "flex", gap: "8px" }}>
                        {!cfg.live && (
                          <button
                            disabled={isBusy}
                            onClick={() => doAction({ _action: "setLive", id: cfg.id })}
                            style={{ padding: "4px 12px", background: "#28a745", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                          >
                            Set Live
                          </button>
                        )}
                        <button
                          disabled={isBusy}
                          onClick={() => doAction({ _action: "delete", id: cfg.id })}
                          style={{ padding: "4px 12px", background: "#fff", color: "#dc3545", border: "1px solid #dc3545", borderRadius: "4px", cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </s-box>
      </s-section>

      {/* Add new configuration */}
      <s-section heading="Add New Configuration">
        <s-box padding="base">
          <form method="POST">
            <input type="hidden" name="_action" value="add" />
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Animation</div>
                <select
                  name="animationKey"
                  value={selectedAnimation}
                  onChange={(e) => setSelectedAnimation(e.target.value)}
                  style={selectStyle}
                >
                  {animations.map((a) => (
                    <option key={a.key} value={a.key}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Sound</div>
                <select
                  name="soundKey"
                  value={selectedSound}
                  onChange={(e) => setSelectedSound(e.target.value)}
                  style={selectStyle}
                >
                  {sounds.map((s) => (
                    <option key={s.key} value={s.key}>{s.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isBusy}
                style={{ padding: "8px 24px", background: "#0066cc", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", height: "38px" }}
              >
                {isBusy ? "Saving..." : "+ Add"}
              </button>
            </div>
          </form>
        </s-box>
      </s-section>
    </s-page>
  );
}

const th: React.CSSProperties = { padding: "10px 14px", fontWeight: 600, borderBottom: "2px solid #e0e0e0" };
const td: React.CSSProperties = { padding: "10px 14px", verticalAlign: "middle" };
const selectStyle: React.CSSProperties = { padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "14px", minWidth: "140px" };

export const headers = (headersArgs: any) => boundary.headers(headersArgs);
