import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation } from "react-router";
import { useState, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate, unauthenticated } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { saveGlobalConfig, fetchGlobalConfig } from "../utils/shopify-graphql";

const PREDEFINED_ANIMATIONS = [
  {
    name: "Slide In",
    key: "slide_in",
    duration: 1000,
    description: "Product slides smoothly diagonally to cart",
  },
  {
    name: "Bounce",
    key: "bounce",
    duration: 1200,
    description: "Product bounces elastically while moving to cart",
  },
  {
    name: "Flip",
    key: "flip",
    duration: 1000,
    description: "Product rotates 360° while flying to cart",
  },
  {
    name: "Pulse",
    key: "pulse",
    duration: 600,
    description: "Cart icon pulses and grows when item added",
  },
  {
    name: "Spiral",
    key: "spiral",
    duration: 1200,
    description: "Product spirals upward while rotating to cart",
  },
];

const PREDEFINED_SOUNDS = [
  {
    name: "Chime",
    key: "chime",
    duration: 500,
    fileUrl: "/sounds/chime.mp3",
    description: "Pleasant notification chime",
  },
  {
    name: "Whoosh",
    key: "whoosh",
    duration: 400,
    fileUrl: "/sounds/whoosh.mp3",
    description: "Smooth swoosh/transition sound",
  },
  {
    name: "Pop",
    key: "pop",
    duration: 300,
    fileUrl: "/sounds/pop.mp3",
    description: "Playful bubble pop sound",
  },
  {
    name: "Bell",
    key: "bell",
    duration: 700,
    fileUrl: "/sounds/bell.mp3",
    description: "Ringing bell notification",
  },
  {
    name: "Sparkle",
    key: "sparkle",
    duration: 600,
    fileUrl: "/sounds/sparkle.mp3",
    description: "Magical tinkling sound effect",
  },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const config = await fetchGlobalConfig(admin);
    return {
      savedAnimationKey: config?.animationKey || null,
      savedSoundKey: config?.soundKey || null,
      predefined: { animations: PREDEFINED_ANIMATIONS, sounds: PREDEFINED_SOUNDS },
    };
  } catch (error) {
    return {
      savedAnimationKey: null,
      savedSoundKey: null,
      predefined: { animations: PREDEFINED_ANIMATIONS, sounds: PREDEFINED_SOUNDS },
    };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return { success: false, error: "Invalid request method" };
  }

  let admin;
  try {
    const auth = await authenticate.admin(request);
    admin = auth.admin;
  } catch (authError: any) {
    // Session expired or missing — try DB fallback (same pattern as working apps)
    if (authError instanceof Response && authError.status === 302) {
      try {
        const sessions = await prisma.session.findMany({
          take: 1,
          orderBy: { id: "desc" },
        });

        if (sessions.length > 0 && sessions[0].shop) {
          const shop = sessions[0].shop;
          console.log(`[FlyToCart] Using DB fallback session for shop: ${shop}`);
          const fallback = await unauthenticated.admin(shop);
          admin = fallback.admin;
        } else {
          return {
            success: false,
            error: "No active session found. Please reload the app from your Shopify Admin.",
            detail: "No sessions in database",
          };
        }
      } catch (dbError: any) {
        console.error("[FlyToCart] DB fallback failed:", dbError);
        return {
          success: false,
          error: "Authentication failed. Please reload the app from your Shopify Admin.",
          detail: dbError?.message || String(dbError),
        };
      }
    } else {
      console.error("[FlyToCart] Auth failed:", authError?.message || authError);
      return {
        success: false,
        error: "Authentication failed. Make sure the app is installed on your store.",
        detail: authError?.message || String(authError),
      };
    }
  }

  try {
    const formData = await request.formData();
    const animationKey = formData.get("animationKey") as string;
    const soundKey = formData.get("soundKey") as string;

    console.log(`[FlyToCart] Saving config — animation: ${animationKey}, sound: ${soundKey}`);

    const animation = PREDEFINED_ANIMATIONS.find((a) => a.key === animationKey);
    const sound = PREDEFINED_SOUNDS.find((s) => s.key === soundKey);

    if (!animation || !sound) {
      return { success: false, error: "Invalid animation or sound selection" };
    }

    await saveGlobalConfig(admin, {
      animationKey: animation.key,
      animationName: animation.name,
      animationDuration: animation.duration,
      soundKey: sound.key,
      soundName: sound.name,
      soundDuration: sound.duration,
      enabled: true,
    });

    console.log("[FlyToCart] Config saved successfully");
    return { success: true, error: null };
  } catch (error: any) {
    const detail = error?.message || String(error);
    console.error("[FlyToCart] Save failed:", detail);
    return {
      success: false,
      error: "Save failed",
      detail,
    };
  }
};

export default function ConfigurePage() {
  const { predefined, savedAnimationKey, savedSoundKey } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const shopify = useAppBridge();
  const isSaving = navigation.state === "submitting";

  const [selectedAnimation, setSelectedAnimation] = useState<string | null>(savedAnimationKey);
  const [selectedSound, setSelectedSound] = useState<string | null>(savedSoundKey);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!actionData) return;
    if (actionData.success) {
      shopify.toast.show("Configuration saved! Animations are now live on your store.", {
        duration: 4000,
      });
    } else if (actionData.success === false) {
      const detail = (actionData as any).detail;
      const msg = detail
        ? `${actionData.error} — ${detail}`
        : actionData.error || "Save failed. Please try again.";
      shopify.toast.show(msg, {
        isError: true,
        duration: 8000,
      });
    }
  }, [actionData]);

  const animation = predefined.animations.find((a) => a.key === selectedAnimation);
  const sound = predefined.sounds.find((s) => s.key === selectedSound);

  const playSound = (soundKey: string) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;

    switch (soundKey) {
      case "chime": {
        const notes = [523, 659, 784]; // C5, E5, G5
        notes.forEach((freq, i) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.3, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.2);
        });
        break;
      }
      case "whoosh": {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }
      case "pop": {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case "bell": {
        const freq = 800;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.05, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.7);
        break;
      }
      case "sparkle": {
        for (let i = 0; i < 3; i++) {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = 1000 + i * 300;
          gain.gain.setValueAtTime(0.2, now + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.15);
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.15);
        }
        break;
      }
    }
  };

  const playPreview = async () => {
    if (!animation || !sound) return;

    setIsPlaying(true);

    try {
      playSound(sound.key);
    } catch (error) {
      console.error("Error playing sound:", error);
    }

    setTimeout(() => {
      setIsPlaying(false);
    }, Math.max(animation.duration, sound.duration));
  };

  const canSubmit = selectedAnimation && selectedSound;

  return (
    <s-page heading="Configure Your Store">
      <s-button slot="primary-action" onClick={() => (window.location.href = "/app")}>
        Back
      </s-button>

      {savedAnimationKey && savedSoundKey && (
        <s-section heading="Currently Active">
          <s-box padding="loose" background="highlight">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "28px" }}>🎬</span>
                <div>
                  <s-text tone="subdued" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Animation</s-text>
                  <s-text variant="headingSm">
                    {predefined.animations.find((a) => a.key === savedAnimationKey)?.name || savedAnimationKey}
                  </s-text>
                </div>
              </div>
              <div style={{ color: "#ccc", fontSize: "20px" }}>+</div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "28px" }}>🔊</span>
                <div>
                  <s-text tone="subdued" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Sound</s-text>
                  <s-text variant="headingSm">
                    {predefined.sounds.find((s) => s.key === savedSoundKey)?.name || savedSoundKey}
                  </s-text>
                </div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <div
                  style={{
                    backgroundColor: "#28a745",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  ✓ Live on store
                </div>
              </div>
            </div>
          </s-box>
        </s-section>
      )}

      <s-section heading="Step 1: Select Animation & Sound">
        <s-box padding="loose">
          <s-stack direction="block" gap="base">
            <div>
              <s-text variant="headingMd" style={{ marginBottom: "16px" }}>
                Pick an Animation
              </s-text>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                {predefined.animations.map((anim) => (
                  <div
                    key={anim.key}
                    onClick={() => setSelectedAnimation(anim.key)}
                    style={{
                      padding: "16px",
                      border:
                        selectedAnimation === anim.key
                          ? "3px solid #0066cc"
                          : "2px solid #e0e0e0",
                      borderRadius: "8px",
                      cursor: "pointer",
                      backgroundColor:
                        selectedAnimation === anim.key ? "#f0f6ff" : "#ffffff",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <s-text variant="headingSm">{anim.name}</s-text>
                    <s-text tone="subdued" style={{ fontSize: "12px", marginTop: "8px" }}>
                      {anim.description}
                    </s-text>
                    <s-text tone="subdued" style={{ fontSize: "11px", marginTop: "4px" }}>
                      {anim.duration}ms
                    </s-text>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "24px" }}>
              <s-text variant="headingMd" style={{ marginBottom: "16px" }}>
                Pick a Sound
              </s-text>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                {predefined.sounds.map((snd) => (
                  <div
                    key={snd.key}
                    onClick={() => setSelectedSound(snd.key)}
                    style={{
                      padding: "16px",
                      border:
                        selectedSound === snd.key
                          ? "3px solid #0066cc"
                          : "2px solid #e0e0e0",
                      borderRadius: "8px",
                      cursor: "pointer",
                      backgroundColor:
                        selectedSound === snd.key ? "#f0f6ff" : "#ffffff",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <s-text variant="headingSm">{snd.name}</s-text>
                    <s-text tone="subdued" style={{ fontSize: "12px", marginTop: "8px" }}>
                      {snd.description}
                    </s-text>
                    <s-text tone="subdued" style={{ fontSize: "11px", marginTop: "4px" }}>
                      {snd.duration}ms
                    </s-text>
                  </div>
                ))}
              </div>
            </div>
          </s-stack>
        </s-box>
      </s-section>

      {selectedAnimation && selectedSound && (
        <s-section heading="Step 2: Preview">
          <s-box padding="loose" background="highlight">
            <s-stack direction="block" gap="base">
              <div>
                <s-text variant="headingMd">Preview</s-text>
                <s-text tone="subdued" style={{ marginTop: "8px", marginBottom: "16px" }}>
                  Selected: <strong>{animation?.name}</strong> with{" "}
                  <strong>{sound?.name}</strong>
                </s-text>
              </div>

              <div
                style={{
                  backgroundColor: "#ffffff",
                  padding: "60px",
                  borderRadius: "8px",
                  textAlign: "center",
                  minHeight: "250px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {isPlaying ? (
                  <div style={{ width: "100%" }}>
                    <div
                      style={{
                        fontSize: "80px",
                        animation: "bounce 0.6s infinite",
                        marginBottom: "20px",
                      }}
                    >
                      🛒
                    </div>
                    <div
                      style={{
                        fontSize: "40px",
                        animation: "fly 1s ease-in-out",
                        marginBottom: "20px",
                      }}
                    >
                      ✨
                    </div>
                    <s-text style={{ marginTop: "16px", fontSize: "16px" }}>
                      Playing: {animation?.name} + {sound?.name}
                    </s-text>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "80px", marginBottom: "20px" }}>🛒</div>
                    <s-button
                      onClick={playPreview}
                      style={{
                        backgroundColor: "#0066cc",
                        color: "white",
                        padding: "16px 48px",
                        fontSize: "16px",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      ▶ Play Preview
                    </s-button>
                    <s-text tone="subdued" style={{ marginTop: "16px" }}>
                      Click to see and hear how it works
                    </s-text>
                  </div>
                )}
              </div>

              <style>{`
                @keyframes bounce {
                  0%, 100% { transform: scale(1); }
                  50% { transform: scale(1.1); }
                }
                @keyframes fly {
                  0% { transform: translateY(0) translateX(0) scale(1); opacity: 1; }
                  100% { transform: translateY(-80px) translateX(60px) scale(0.3); opacity: 0; }
                }
              `}</style>
            </s-stack>
          </s-box>
        </s-section>
      )}

      {canSubmit && (
        <s-section heading="">
          <form method="POST">
            <input type="hidden" name="animationKey" value={selectedAnimation} />
            <input type="hidden" name="soundKey" value={selectedSound} />
            <s-button
              type="submit"
              disabled={isSaving}
              style={{ backgroundColor: isSaving ? "#999" : "#28a745", color: "white", cursor: isSaving ? "not-allowed" : "pointer" }}
            >
              {isSaving ? "Saving..." : "Save Configuration & Apply to Store"}
            </s-button>
          </form>
        </s-section>
      )}
    </s-page>
  );
}

export const headers = (headersArgs: any) => {
  return boundary.headers(headersArgs);
};
