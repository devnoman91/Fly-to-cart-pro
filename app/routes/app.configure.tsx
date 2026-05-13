import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, Form } from "react-router";
import { useState, useEffect, useRef } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { fetchConfigurations, saveConfigurations, type FtcConfig } from "../utils/shopify-graphql";

const ANIMATIONS = [
  { key: "slide_in", name: "Slide In",  desc: "Product slides smoothly to cart",       emoji: "➡️"  },
  { key: "bounce",   name: "Bounce",    desc: "Product bounces elastically to cart",    emoji: "🏀"  },
  { key: "flip",     name: "Flip",      desc: "Product rotates 360° while flying",      emoji: "🔄"  },
  { key: "pulse",    name: "Pulse",     desc: "Cart icon pulses when item is added",    emoji: "💫"  },
  { key: "spiral",   name: "Spiral",    desc: "Product spirals upward to cart",         emoji: "🌀"  },
  { key: "zoom",     name: "Zoom",      desc: "Product zooms in then flies to cart",    emoji: "🔎"  },
  { key: "shake",    name: "Shake",     desc: "Product shakes then shoots to cart",     emoji: "📳"  },
  { key: "float",    name: "Float",     desc: "Product floats gently with a glow trail", emoji: "🎈" },
];

const SOUNDS = [
  { key: "chime",   name: "Chime",   desc: "Pleasant notification chime",   emoji: "🔔" },
  { key: "whoosh",  name: "Whoosh",  desc: "Smooth swoosh transition",      emoji: "💨" },
  { key: "pop",     name: "Pop",     desc: "Playful bubble pop",            emoji: "🫧" },
  { key: "bell",    name: "Bell",    desc: "Classic ringing bell",          emoji: "🛎️" },
  { key: "sparkle", name: "Sparkle", desc: "Magical tinkling effect",       emoji: "✨" },
  { key: "coin",    name: "Coin",    desc: "Coin jingle cash register",     emoji: "🪙" },
  { key: "laser",   name: "Laser",   desc: "Sci-fi laser zap effect",       emoji: "⚡" },
  { key: "drum",    name: "Drum",    desc: "Deep bass drum hit",            emoji: "🥁" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const configs = await fetchConfigurations(admin);
  return { configs };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") return { success: false, error: "Invalid method" };

  const { admin } = await authenticate.admin(request);

  try {
    const formData = await request.formData();
    const animationKey = formData.get("animationKey") as string;
    const soundKey     = formData.get("soundKey") as string;

    if (!animationKey || !soundKey) return { success: false, error: "Select both animation and sound" };

    const configs = await fetchConfigurations(admin);
    const newConfig: FtcConfig = {
      id: Date.now().toString(),
      animationKey,
      soundKey,
      live: false,
    };
    await saveConfigurations(admin, [...configs, newConfig]);
    console.log(`[FlyToCart] Added config — animation: ${animationKey}, sound: ${soundKey}`);
    return { success: true, error: null };
  } catch (err: any) {
    console.error("[FlyToCart] Add failed:", err?.message);
    return { success: false, error: err?.message || "Failed to save" };
  }
};

export default function ConfigurePage() {
  useLoaderData<typeof loader>();
  const actionData  = useActionData<typeof action>();
  const navigation  = useNavigation();
  const shopify     = useAppBridge();
  const isSaving    = navigation.state === "submitting";

  const [selectedAnimation, setSelectedAnimation] = useState<string | null>(null);
  const [selectedSound,     setSelectedSound]      = useState<string | null>(null);
  const [isPlaying,         setIsPlaying]          = useState(false);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const cartRef       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!actionData) return;
    if (actionData.success) {
      shopify.toast.show("Animation added! Go to My Animations to set it live.", { duration: 4000 });
    } else if (actionData.success === false && actionData.error) {
      shopify.toast.show(actionData.error, { isError: true, duration: 5000 });
    }
  }, [actionData]);

  const canAdd = selectedAnimation && selectedSound;

  const playSound = (soundKey: string) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const map: Record<string, () => void> = {
        chime:   () => [523,659,784].forEach((f,i) => { const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value=f; g.gain.setValueAtTime(0.3,now+i*0.1); g.gain.exponentialRampToValueAtTime(0.01,now+i*0.1+0.2); o.start(now+i*0.1); o.stop(now+i*0.1+0.2); }),
        whoosh:  () => { const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.setValueAtTime(400,now); o.frequency.exponentialRampToValueAtTime(100,now+0.4); g.gain.setValueAtTime(0.3,now); g.gain.exponentialRampToValueAtTime(0.01,now+0.4); o.start(now); o.stop(now+0.4); },
        pop:     () => { const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.setValueAtTime(150,now); o.frequency.exponentialRampToValueAtTime(50,now+0.1); g.gain.setValueAtTime(0.4,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.1); o.start(now); o.stop(now+0.1); },
        bell:    () => { const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value=800; g.gain.setValueAtTime(0.3,now); g.gain.exponentialRampToValueAtTime(0.01,now+0.7); o.start(now); o.stop(now+0.7); },
        sparkle: () => [0,1,2].forEach(i => { const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value=1000+i*300; g.gain.setValueAtTime(0.2,now+i*0.15); g.gain.exponentialRampToValueAtTime(0.01,now+i*0.15+0.15); o.start(now+i*0.15); o.stop(now+i*0.15+0.15); }),
        coin:    () => [1200,1500,1800,1400].forEach((f,i) => { const o=ctx.createOscillator(),g=ctx.createGain(); o.type='triangle' as OscillatorType; o.connect(g); g.connect(ctx.destination); o.frequency.value=f; g.gain.setValueAtTime(0.2,now+i*0.05); g.gain.exponentialRampToValueAtTime(0.001,now+i*0.05+0.12); o.start(now+i*0.05); o.stop(now+i*0.05+0.12); }),
        laser:   () => { const o=ctx.createOscillator(),g=ctx.createGain(); o.type='sawtooth' as OscillatorType; o.connect(g); g.connect(ctx.destination); o.frequency.setValueAtTime(1200,now); o.frequency.exponentialRampToValueAtTime(80,now+0.25); g.gain.setValueAtTime(0.3,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.25); o.start(now); o.stop(now+0.25); },
        drum:    () => { const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.setValueAtTime(160,now); o.frequency.exponentialRampToValueAtTime(30,now+0.15); g.gain.setValueAtTime(0.5,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.2); o.start(now); o.stop(now+0.2); },
      };
      map[soundKey]?.();
    } catch {}
  };

  const runPreviewAnimation = (animKey: string) => {
    const box    = previewBoxRef.current;
    const cartEl = cartRef.current;
    if (!box || !cartEl) return;

    // Pulse: no bubble, just animate the cart icon directly
    if (animKey === 'pulse') {
      cartEl.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.45)' },
        { transform: 'scale(1.1)' },
        { transform: 'scale(1.35)' },
        { transform: 'scale(1)' },
      ], { duration: 700, easing: 'ease-in-out' });
      return;
    }

    // Create a small product bubble that flies from left to the cart in the center
    // Box is 160×160. Bubble starts at left:16px, vertically centered → center ≈ (29px, 80px)
    // Cart is at center → (80px, 80px). So translateX target ≈ 51px, translateY ≈ 0
    const bubble = document.createElement('div');
    bubble.style.cssText = 'position:absolute;left:16px;top:50%;transform:translateY(-50%);font-size:24px;pointer-events:none;z-index:5;';
    bubble.textContent = '🛍️';
    box.appendChild(bubble);

    const frameMap: Record<string, Keyframe[]> = {
      slide_in: [
        { transform: 'translateY(-50%) translateX(0) scale(1)',        opacity: 1, offset: 0 },
        { transform: 'translateY(-50%) translateX(51px) scale(0.15)',  opacity: 0, offset: 1 },
      ],
      bounce: [
        { transform: 'translateY(-50%) scale(1,1)',                          opacity: 1, offset: 0    },
        { transform: 'translateY(calc(-50% + 5px)) scale(1.2,0.75)',         opacity: 1, offset: 0.07 },
        { transform: 'translateY(calc(-50% - 22px)) scale(0.85,1.2)',        opacity: 1, offset: 0.2  },
        { transform: 'translateY(calc(-50% - 22px)) scale(1,1)',             opacity: 1, offset: 0.27 },
        { transform: 'translateY(calc(-50% + 3px)) scale(1.15,0.88)',        opacity: 1, offset: 0.38 },
        { transform: 'translateY(calc(-50% - 10px)) scale(0.92,1.1)',        opacity: 1, offset: 0.47 },
        { transform: 'translateY(-50%) scale(1,1)',                          opacity: 1, offset: 0.54 },
        { transform: 'translateY(-50%) translateX(30px) scale(0.6)',         opacity: 1, offset: 0.78 },
        { transform: 'translateY(-50%) translateX(51px) scale(0.1)',         opacity: 0, offset: 1    },
      ],
      flip: [
        { transform: 'translateY(-50%) translateX(0) rotateY(0deg) scale(1)',       opacity: 1,   offset: 0    },
        { transform: 'translateY(-50%) translateX(17px) rotateY(180deg) scale(0.8)',opacity: 1,   offset: 0.33 },
        { transform: 'translateY(-50%) translateX(34px) rotateY(360deg) scale(0.5)',opacity: 0.7, offset: 0.66 },
        { transform: 'translateY(-50%) translateX(51px) rotateY(540deg) scale(0.1)',opacity: 0,   offset: 1    },
      ],
      spiral: [
        { transform: 'translateY(-50%) translate(0,0) rotate(0deg) scale(1)',            opacity: 1, offset: 0    },
        { transform: 'translateY(-50%) translate(10px,-22px) rotate(120deg) scale(0.8)', opacity: 1, offset: 0.28 },
        { transform: 'translateY(-50%) translate(30px,12px) rotate(240deg) scale(0.55)', opacity: 1, offset: 0.56 },
        { transform: 'translateY(-50%) translate(51px,0) rotate(360deg) scale(0.1)',     opacity: 0, offset: 1    },
      ],
      zoom: [
        { transform: 'translateY(-50%) scale(0.1)',                   opacity: 0, offset: 0    },
        { transform: 'translateY(-50%) scale(1.4)',                   opacity: 1, offset: 0.18 },
        { transform: 'translateY(-50%) scale(1.0)',                   opacity: 1, offset: 0.28 },
        { transform: 'translateY(-50%) translateX(30px) scale(0.6)', opacity: 1, offset: 0.68 },
        { transform: 'translateY(-50%) translateX(51px) scale(0.1)', opacity: 0, offset: 1    },
      ],
      shake: [
        { transform: 'translateY(-50%) translateX(0)',                       opacity: 1, offset: 0    },
        { transform: 'translateY(-50%) translateX(-9px)',                    opacity: 1, offset: 0.08 },
        { transform: 'translateY(-50%) translateX(9px)',                     opacity: 1, offset: 0.16 },
        { transform: 'translateY(-50%) translateX(-7px)',                    opacity: 1, offset: 0.24 },
        { transform: 'translateY(-50%) translateX(7px)',                     opacity: 1, offset: 0.32 },
        { transform: 'translateY(-50%) translateX(-4px)',                    opacity: 1, offset: 0.38 },
        { transform: 'translateY(-50%) translateX(0)',                       opacity: 1, offset: 0.44 },
        { transform: 'translateY(-50%) translateX(30px) scale(0.65)',        opacity: 1, offset: 0.72 },
        { transform: 'translateY(-50%) translateX(51px) scale(0.1)',         opacity: 0, offset: 1    },
      ],
      float: [
        { transform: 'translateY(-50%) translate(0,0) scale(1)',           opacity: 1, offset: 0    },
        { transform: 'translateY(-50%) translate(8px,-18px) scale(1.05)', opacity: 1, offset: 0.2  },
        { transform: 'translateY(-50%) translate(18px,-22px) scale(1.0)', opacity: 1, offset: 0.38 },
        { transform: 'translateY(-50%) translate(33px,-10px) scale(0.75)',opacity: 1, offset: 0.62 },
        { transform: 'translateY(-50%) translate(51px,0) scale(0.1)',     opacity: 0, offset: 1    },
      ],
    };

    const frames = frameMap[animKey];
    if (!frames) { bubble.remove(); return; }

    const durations: Record<string, number> = { bounce: 1100, float: 1300, spiral: 1100, shake: 950 };
    const duration = durations[animKey] ?? 800;

    const anim = bubble.animate(frames, { duration, easing: 'ease-in-out', fill: 'forwards' });

    setTimeout(() => {
      cartEl.animate([
        { transform: 'scale(1)' }, { transform: 'scale(1.4)' },
        { transform: 'scale(0.9)' }, { transform: 'scale(1)' },
      ], { duration: 350, easing: 'ease-out' });
    }, duration * 0.88);

    anim.onfinish = () => bubble.remove();
  };

  const handlePreview = () => {
    if (!selectedAnimation || !selectedSound) return;
    setIsPlaying(true);
    playSound(selectedSound);
    runPreviewAnimation(selectedAnimation);
    setTimeout(() => setIsPlaying(false), 1400);
  };

  return (
    <s-page heading="Configure Animation">
      <s-button slot="primary-action" onClick={() => (window.location.href = "/app/animations")} variant="secondary">
        My Animations
      </s-button>
      <s-button slot="secondary-action" onClick={() => (window.location.href = "/app")}>
        Back
      </s-button>

      {/* Step 1: Animation */}
      <s-section heading="Step 1 — Choose Animation">
        <s-box padding="base">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
            {ANIMATIONS.map((anim) => {
              const active = selectedAnimation === anim.key;
              return (
                <div
                  key={anim.key}
                  onClick={() => setSelectedAnimation(anim.key)}
                  style={{
                    padding: "16px",
                    border: active ? "2px solid #0066cc" : "2px solid #e0e0e0",
                    borderRadius: "10px",
                    cursor: "pointer",
                    background: active ? "#f0f6ff" : "#fff",
                    textAlign: "center",
                    transition: "all 0.15s",
                    userSelect: "none",
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>{anim.emoji}</div>
                  <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>{anim.name}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>{anim.desc}</div>
                  {active && <div style={{ marginTop: "8px", fontSize: "11px", color: "#0066cc", fontWeight: 600 }}>✓ Selected</div>}
                </div>
              );
            })}
          </div>
        </s-box>
      </s-section>

      {/* Step 2: Sound */}
      <s-section heading="Step 2 — Choose Sound">
        <s-box padding="base">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
            {SOUNDS.map((snd) => {
              const active = selectedSound === snd.key;
              return (
                <div
                  key={snd.key}
                  onClick={() => { setSelectedSound(snd.key); playSound(snd.key); }}
                  style={{
                    padding: "16px",
                    border: active ? "2px solid #0066cc" : "2px solid #e0e0e0",
                    borderRadius: "10px",
                    cursor: "pointer",
                    background: active ? "#f0f6ff" : "#fff",
                    textAlign: "center",
                    transition: "all 0.15s",
                    userSelect: "none",
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>{snd.emoji}</div>
                  <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>{snd.name}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>{snd.desc}</div>
                  {active && <div style={{ marginTop: "8px", fontSize: "11px", color: "#0066cc", fontWeight: 600 }}>✓ Selected</div>}
                </div>
              );
            })}
          </div>
        </s-box>
      </s-section>

      {/* Step 3: Preview + Save */}
      {canAdd && (
        <s-section heading="Step 3 — Preview & Save">
          <s-box padding="base">
            <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
              {/* Preview box */}
              <div
                ref={previewBoxRef}
                style={{
                  flex: "0 0 auto",
                  width: "160px",
                  height: "160px",
                  background: "#f9f9f9",
                  border: "2px dashed #ccc",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                }}
                onClick={handlePreview}
              >
                <div ref={cartRef} style={{ fontSize: "48px" }}>🛒</div>
                <div style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>{isPlaying ? "Playing..." : "▶ Click to preview"}</div>
              </div>

              {/* Summary + save */}
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Selected combination</div>
                  <div style={{ fontSize: "16px", fontWeight: 600 }}>
                    {ANIMATIONS.find(a => a.key === selectedAnimation)?.emoji}{" "}
                    {ANIMATIONS.find(a => a.key === selectedAnimation)?.name}
                    {" + "}
                    {SOUNDS.find(s => s.key === selectedSound)?.emoji}{" "}
                    {SOUNDS.find(s => s.key === selectedSound)?.name}
                  </div>
                </div>
                <Form method="POST">
                  <input type="hidden" name="animationKey" value={selectedAnimation ?? ""} />
                  <input type="hidden" name="soundKey"     value={selectedSound ?? ""} />
                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{
                      padding: "10px 28px",
                      background: isSaving ? "#999" : "#0066cc",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: isSaving ? "not-allowed" : "pointer",
                    }}
                  >
                    {isSaving ? "Saving..." : "Add to My Animations"}
                  </button>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
                    Then go to My Animations to set it live on your store
                  </div>
                </Form>
              </div>
            </div>
          </s-box>


        </s-section>
      )}
    </s-page>
  );
}

export const headers = (headersArgs: any) => boundary.headers(headersArgs);
