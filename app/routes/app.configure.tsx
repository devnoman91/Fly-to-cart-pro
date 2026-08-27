import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, useNavigate, useRouteError, Form, useFetcher } from "react-router";
import { useState, useEffect, useRef } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { requireEntitlements, getEntitlements } from "../services/billing.server";
import { getServerT, type MessageKey } from "../i18n";
import { useT } from "../i18n/context";
import { fetchConfigurations, saveConfigurations, type FtcConfig } from "../utils/shopify-graphql";
import {
  card,
  cardPadding,
  mutedText,
  pageShell,
  primaryButton,
  secondaryButton,
  sectionTitle,
} from "../styles/ui";

// Effect names stay in English; `descKey` points at the translated description.
const ANIMATIONS: { key: string; name: string; descKey: MessageKey; emoji: string }[] = [
  { key: "slide_in", name: "Slide In",  descKey: "config.animDesc.slide_in", emoji: "➡️"  },
  { key: "bounce",   name: "Bounce",    descKey: "config.animDesc.bounce",   emoji: "🏀"  },
  { key: "flip",     name: "Flip",      descKey: "config.animDesc.flip",     emoji: "🔄"  },
  { key: "pulse",    name: "Pulse",     descKey: "config.animDesc.pulse",    emoji: "💫"  },
  { key: "spiral",   name: "Spiral",    descKey: "config.animDesc.spiral",   emoji: "🌀"  },
  { key: "zoom",     name: "Zoom",      descKey: "config.animDesc.zoom",     emoji: "🔎"  },
  { key: "shake",    name: "Shake",     descKey: "config.animDesc.shake",    emoji: "📳"  },
  { key: "float",    name: "Float",     descKey: "config.animDesc.float",    emoji: "🎈" },
];

const SOUNDS: { key: string; name: string; descKey: MessageKey; emoji: string }[] = [
  { key: "chime",   name: "Chime",   descKey: "config.soundDesc.chime",   emoji: "🔔" },
  { key: "whoosh",  name: "Whoosh",  descKey: "config.soundDesc.whoosh",  emoji: "💨" },
  { key: "pop",     name: "Pop",     descKey: "config.soundDesc.pop",     emoji: "🫧" },
  { key: "bell",    name: "Bell",    descKey: "config.soundDesc.bell",    emoji: "🛎️" },
  { key: "sparkle", name: "Sparkle", descKey: "config.soundDesc.sparkle", emoji: "✨" },
  { key: "coin",    name: "Coin",    descKey: "config.soundDesc.coin",    emoji: "🪙" },
  { key: "laser",   name: "Laser",   descKey: "config.soundDesc.laser",   emoji: "⚡" },
  { key: "drum",    name: "Drum",    descKey: "config.soundDesc.drum",    emoji: "🥁" },
];

const optionCardStyle = (active: boolean): React.CSSProperties => ({
  ...card,
  background: active ? "#f8fafc" : "#fff",
  border: active ? "2px solid #111827" : "1px solid #d7d7d7",
  cursor: "pointer",
  display: "block",
  minHeight: "142px",
  padding: "16px",
  width: "100%",
  textAlign: "left",
  transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
  userSelect: "none",
});

const stepCardStyle: React.CSSProperties = {
  ...cardPadding,
  marginBottom: "16px",
};

const optionalTagStyle: React.CSSProperties = {
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
  borderRadius: "999px",
  color: "#6b7280",
  fontSize: "11px",
  fontWeight: 700,
  marginLeft: "8px",
  padding: "3px 8px",
  verticalAlign: "middle",
};

const clearButtonStyle: React.CSSProperties = {
  ...secondaryButton,
  fontSize: "12px",
  minHeight: "30px",
  padding: "0 10px",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const { isPremium } = await requireEntitlements(session.shop, request);
  const configs = await fetchConfigurations(admin);
  return { configs, isPremium };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const t = getServerT(request);
  if (request.method !== "POST") return { success: false, error: t("config.error.invalidMethod") };

  const { admin, session } = await authenticate.admin(request);
  const { isPremium } = await getEntitlements(session.shop);

  try {
    const formData = await request.formData();
    // Either key may be "" — a config can be animation only, sound only, or both.
    const animationKey  = (formData.get("animationKey") as string) || "";
    const soundKey      = (formData.get("soundKey") as string) || "";
    const customSoundUrl = (formData.get("customSoundUrl") as string) || undefined;

    if (!animationKey && !soundKey) {
      return { success: false, error: t("config.error.selectOne") };
    }

    // Single-mode (exactly one of the two) is a Premium feature. Basic must pick both.
    const singleMode = (!!animationKey) !== (!!soundKey);
    if (singleMode && !isPremium) {
      return { success: false, error: t("config.error.premiumSingle") };
    }

    if (soundKey === "custom" && !customSoundUrl) {
      return { success: false, error: t("config.error.customUpload") };
    }

    const configs = await fetchConfigurations(admin);
    const newConfig: FtcConfig = {
      id: Date.now().toString(),
      animationKey,
      soundKey,
      ...(customSoundUrl ? { customSoundUrl } : {}),
      live: false,
    };
    await saveConfigurations(admin, [...configs, newConfig]);
    console.log(`[FlyToCart] Added config — animation: ${animationKey}, sound: ${soundKey}`);
    return { success: true, error: null };
  } catch (err: any) {
    console.error("[FlyToCart] Add failed:", err?.message);
    return { success: false, error: err?.message || t("config.error.saveFailed") };
  }
};

export default function ConfigurePage() {
  const { isPremium } = useLoaderData<typeof loader>();
  const actionData  = useActionData<typeof action>();
  const navigation  = useNavigation();
  const shopify     = useAppBridge();
  const navigate    = useNavigate();
  const t           = useT();
  const isSaving    = navigation.state === "submitting";

  const uploadFetcher = useFetcher<{ url?: string; error?: string }>();

  const [selectedAnimation, setSelectedAnimation] = useState<string | null>(null);
  const [selectedSound,     setSelectedSound]      = useState<string | null>(null);
  const [customSoundUrl,    setCustomSoundUrl]      = useState<string | null>(null);
  const [customFileName,    setCustomFileName]      = useState<string>("");
  const [isPlaying,         setIsPlaying]           = useState(false);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const cartRef       = useRef<HTMLDivElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  const isUploading = uploadFetcher.state !== "idle";

  // Handle upload result
  useEffect(() => {
    if (uploadFetcher.state === "idle" && uploadFetcher.data) {
      if (uploadFetcher.data.url) {
        setCustomSoundUrl(uploadFetcher.data.url);
      } else if (uploadFetcher.data.error) {
        shopify.toast.show(uploadFetcher.data.error, { isError: true, duration: 5000 });
      }
    }
  }, [uploadFetcher.state, uploadFetcher.data]);

  useEffect(() => {
    if (!actionData) return;
    if (actionData.success) {
      shopify.toast.show(t("config.toast.saved"), { duration: 4000 });
    } else if (actionData.success === false && actionData.error) {
      shopify.toast.show(actionData.error, { isError: true, duration: 5000 });
    }
  }, [actionData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomFileName(file.name);
    setCustomSoundUrl(null);
    const fd = new FormData();
    fd.append("file", file);
    uploadFetcher.submit(fd, {
      method: "post",
      action: "/api/sound-upload",
      encType: "multipart/form-data",
    });
  };

  // Custom sound additionally needs its upload finished before saving.
  const customSoundReady = selectedSound !== "custom" || Boolean(customSoundUrl);
  // Premium: at least one of the two. Basic: single-mode is locked, so both are required.
  const hasSelection = isPremium
    ? Boolean(selectedAnimation || selectedSound)
    : Boolean(selectedAnimation && selectedSound);
  const canAdd = hasSelection && customSoundReady;

  const modeLabel =
    selectedAnimation && selectedSound
      ? t("config.mode.both")
      : selectedAnimation
        ? t("config.mode.animationOnly")
        : selectedSound
          ? t("config.mode.soundOnly")
          : t("config.mode.none");

  const playSound = (soundKey: string) => {
    if (soundKey === "custom") {
      if (customSoundUrl) {
        try {
          const audio = new Audio(customSoundUrl);
          audio.volume = 0.8;
          audio.play().catch(() => {});
        } catch {}
      }
      return;
    }
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

    const boxWidth = box.clientWidth || 240;
    const boxHeight = box.clientHeight || 220;
    const bubbleLeft = 24;
    const bubbleSize = 54;
    const targetX = (boxWidth / 2) - bubbleLeft - (bubbleSize / 2);

    const bubble = document.createElement('div');
    bubble.style.cssText = [
      'position:absolute',
      `left:${bubbleLeft}px`,
      'top:50%',
      `width:${bubbleSize}px`,
      `height:${bubbleSize}px`,
      'transform:translateY(-50%)',
      'border-radius:12px',
      'background:linear-gradient(135deg,#f8fafc 0%,#ffffff 48%,#e9f5ff 100%)',
      'border:2px solid #ffffff',
      'box-shadow:0 10px 22px rgba(17,24,39,0.20)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'pointer-events:none',
      'z-index:5',
      'will-change:transform,opacity',
      'backface-visibility:hidden',
    ].join(';');
    bubble.innerHTML = [
      '<div style="width:34px;height:34px;border-radius:9px;background:#111827;position:relative;box-shadow:inset 0 -8px 0 rgba(255,255,255,0.14);">',
      '<div style="position:absolute;left:8px;right:8px;top:-6px;height:12px;border:2px solid #111827;border-bottom:0;border-radius:12px 12px 0 0;"></div>',
      '<div style="position:absolute;left:10px;top:12px;width:14px;height:3px;border-radius:999px;background:#ffffff;"></div>',
      '</div>',
    ].join('');
    box.appendChild(bubble);

    const frameMap: Record<string, Keyframe[]> = {
      slide_in: [
        { transform: 'translate3d(0,-50%,0) scale(1)', opacity: 1, offset: 0 },
        { transform: `translate3d(${targetX * 0.55}px,calc(-50% - ${boxHeight * 0.18}px),0) scale(0.85)`, opacity: 1, offset: 0.52 },
        { transform: `translate3d(${targetX}px,-50%,0) scale(0.28)`, opacity: 0, offset: 1 },
      ],
      bounce: [
        { transform: 'translate3d(0,-50%,0) scale(1)', opacity: 1, offset: 0 },
        { transform: 'translate3d(0,calc(-50% + 8px),0) scale(1.14,0.88)', opacity: 1, offset: 0.1 },
        { transform: `translate3d(${targetX * 0.22}px,calc(-50% - ${boxHeight * 0.28}px),0) scale(0.96,1.05)`, opacity: 1, offset: 0.32 },
        { transform: `translate3d(${targetX * 0.48}px,calc(-50% + 4px),0) scale(1.05,0.94)`, opacity: 1, offset: 0.55 },
        { transform: `translate3d(${targetX * 0.74}px,calc(-50% - ${boxHeight * 0.12}px),0) scale(0.78)`, opacity: 0.9, offset: 0.78 },
        { transform: `translate3d(${targetX}px,-50%,0) scale(0.2)`, opacity: 0, offset: 1 },
      ],
      flip: [
        { transform: 'translate3d(0,-50%,0) rotateY(0deg) scale(1)', opacity: 1, offset: 0 },
        { transform: `translate3d(${targetX * 0.35}px,calc(-50% - ${boxHeight * 0.18}px),0) rotateY(180deg) scale(0.88)`, opacity: 1, offset: 0.36 },
        { transform: `translate3d(${targetX * 0.7}px,calc(-50% - ${boxHeight * 0.08}px),0) rotateY(360deg) scale(0.6)`, opacity: 0.75, offset: 0.72 },
        { transform: `translate3d(${targetX}px,-50%,0) rotateY(540deg) scale(0.18)`, opacity: 0, offset: 1 },
      ],
      spiral: [
        { transform: 'translate3d(0,-50%,0) rotate(0deg) scale(1)', opacity: 1, offset: 0 },
        { transform: `translate3d(${targetX * 0.22}px,calc(-50% - ${boxHeight * 0.28}px),0) rotate(130deg) scale(0.88)`, opacity: 1, offset: 0.28 },
        { transform: `translate3d(${targetX * 0.6}px,calc(-50% + ${boxHeight * 0.1}px),0) rotate(260deg) scale(0.58)`, opacity: 0.9, offset: 0.62 },
        { transform: `translate3d(${targetX}px,-50%,0) rotate(390deg) scale(0.16)`, opacity: 0, offset: 1 },
      ],
      zoom: [
        { transform: 'translate3d(0,-50%,0) scale(0.4)', opacity: 0, offset: 0 },
        { transform: 'translate3d(0,-50%,0) scale(1.18)', opacity: 1, offset: 0.2 },
        { transform: `translate3d(${targetX * 0.56}px,calc(-50% - ${boxHeight * 0.16}px),0) scale(0.72)`, opacity: 1, offset: 0.66 },
        { transform: `translate3d(${targetX}px,-50%,0) scale(0.2)`, opacity: 0, offset: 1 },
      ],
      shake: [
        { transform: 'translate3d(0,-50%,0)', opacity: 1, offset: 0 },
        { transform: 'translate3d(-9px,-50%,0)', opacity: 1, offset: 0.08 },
        { transform: 'translate3d(9px,-50%,0)', opacity: 1, offset: 0.16 },
        { transform: 'translate3d(-6px,-50%,0)', opacity: 1, offset: 0.24 },
        { transform: 'translate3d(0,-50%,0)', opacity: 1, offset: 0.36 },
        { transform: `translate3d(${targetX * 0.62}px,calc(-50% - ${boxHeight * 0.16}px),0) scale(0.7)`, opacity: 1, offset: 0.72 },
        { transform: `translate3d(${targetX}px,-50%,0) scale(0.2)`, opacity: 0, offset: 1 },
      ],
      float: [
        { transform: 'translate3d(0,-50%,0) scale(1)', opacity: 1, offset: 0 },
        { transform: `translate3d(${targetX * 0.18}px,calc(-50% - ${boxHeight * 0.2}px),0) scale(1.02)`, opacity: 1, offset: 0.28 },
        { transform: `translate3d(${targetX * 0.58}px,calc(-50% - ${boxHeight * 0.24}px),0) scale(0.72)`, opacity: 0.9, offset: 0.68 },
        { transform: `translate3d(${targetX}px,-50%,0) scale(0.18)`, opacity: 0, offset: 1 },
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
    if (!canAdd) return;
    setIsPlaying(true);
    if (selectedSound) playSound(selectedSound);
    if (selectedAnimation) runPreviewAnimation(selectedAnimation);
    setTimeout(() => setIsPlaying(false), 1400);
  };

  const selectedAnimationOption = ANIMATIONS.find((a) => a.key === selectedAnimation);
  const selectedSoundOption = selectedSound === "custom"
    ? { name: customFileName ? t("config.customSoundName", { name: customFileName }) : t("config.customSoundDefault"), emoji: "🎵" }
    : SOUNDS.find((s) => s.key === selectedSound);

  return (
    <s-page heading={t("config.pageHeading")}>
      <s-button slot="primary-action" onClick={() => navigate("/app/animations")} variant="secondary">
        {t("config.myAnimations")}
      </s-button>

      <div style={pageShell}>
      <div style={{ ...cardPadding, marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: "0 0 6px", color: "#111827", fontSize: "22px", lineHeight: "1.2" }}>
              {t("config.build.title")}
            </h2>
            <p style={{ ...mutedText, margin: 0, maxWidth: "640px" }}>
              {isPremium ? t("config.build.descPremium") : t("config.build.descBasic")}
            </p>
          </div>
          <div
            style={{
              alignItems: "center",
              background: canAdd ? "#111827" : "#f3f4f6",
              border: canAdd ? "1px solid #111827" : "1px solid #e5e7eb",
              borderRadius: "999px",
              color: canAdd ? "#fff" : "#374151",
              display: "inline-flex",
              fontSize: "12px",
              fontWeight: 800,
              height: "30px",
              padding: "0 12px",
            }}
          >
            {modeLabel}
          </div>
        </div>
      </div>

      {!isPremium && (
        <div
          style={{
            ...cardPadding,
            marginBottom: "16px",
            background: "#eef2ff",
            border: "1px solid #c7d2fe",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: "13px", color: "#3730a3", lineHeight: 1.5 }}>
            <strong>{t("config.upgrade.bold")}</strong> {t("config.upgrade.body")}
          </div>
          <button type="button" style={{ ...primaryButton, minHeight: "34px" }} onClick={() => navigate("/app/billing")}>
            {t("config.upgrade.cta")}
          </button>
        </div>
      )}

      <section style={stepCardStyle}>
        <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <h2 style={sectionTitle}>
              {t("config.step1.title")}{" "}
              {isPremium && <span style={optionalTagStyle}>{t("config.optional")}</span>}
            </h2>
            <p style={{ ...mutedText, margin: 0 }}>
              {isPremium ? t("config.step1.descPremium") : t("config.step1.descBasic")}
            </p>
          </div>
          {isPremium && selectedAnimation && (
            <button type="button" onClick={() => setSelectedAnimation(null)} style={clearButtonStyle}>
              {t("config.clearAnimation")}
            </button>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "12px" }}>
            {ANIMATIONS.map((anim) => {
              const active = selectedAnimation === anim.key;
              return (
                <button
                  type="button"
                  key={anim.key}
                  onClick={() => setSelectedAnimation(active ? null : anim.key)}
                  style={optionCardStyle(active)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "28px", lineHeight: 1 }}>{anim.emoji}</div>
                    {active && (
                      <span style={{ background: "#111827", borderRadius: "999px", color: "#fff", fontSize: "11px", fontWeight: 800, padding: "3px 8px" }}>
                        {t("config.selected")}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 750, fontSize: "14px", marginTop: "12px", color: "#111827" }}>{anim.name}</div>
                  <div style={{ ...mutedText, marginTop: "5px" }}>{t(anim.descKey)}</div>
                </button>
              );
            })}
        </div>
      </section>

      <section style={stepCardStyle}>
        <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <h2 style={sectionTitle}>
              {t("config.step2.title")}{" "}
              {isPremium && <span style={optionalTagStyle}>{t("config.optional")}</span>}
            </h2>
            <p style={{ ...mutedText, margin: 0 }}>
              {isPremium ? t("config.step2.descPremium") : t("config.step2.descBasic")}
            </p>
          </div>
          {isPremium && selectedSound && (
            <button
              type="button"
              onClick={() => {
                setSelectedSound(null);
                setCustomSoundUrl(null);
                setCustomFileName("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              style={clearButtonStyle}
            >
              {t("config.clearSound")}
            </button>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "12px" }}>
            {SOUNDS.map((snd) => {
              const active = selectedSound === snd.key;
              return (
                <button
                  type="button"
                  key={snd.key}
                  onClick={() => {
                    if (active) { setSelectedSound(null); return; }
                    setSelectedSound(snd.key);
                    playSound(snd.key);
                  }}
                  style={optionCardStyle(active)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "28px", lineHeight: 1 }}>{snd.emoji}</div>
                    {active && (
                      <span style={{ background: "#111827", borderRadius: "999px", color: "#fff", fontSize: "11px", fontWeight: 800, padding: "3px 8px" }}>
                        {t("config.selected")}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 750, fontSize: "14px", marginTop: "12px", color: "#111827" }}>{snd.name}</div>
                  <div style={{ ...mutedText, marginTop: "5px" }}>{t(snd.descKey)}</div>
                </button>
              );
            })}

            {/* Custom upload card */}
            {(() => {
              const active = selectedSound === "custom";
              return (
                <button
                  type="button"
                  onClick={() => setSelectedSound(active ? null : "custom")}
                  style={{
                    ...optionCardStyle(active),
                    minHeight: "142px",
                    background: active ? "#f8fafc" : "#fff",
                    border: active
                      ? "2px solid #111827"
                      : "1px dashed #d7d7d7",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "28px", lineHeight: 1 }}>🎵</div>
                    {active && (
                      <span style={{ background: "#111827", borderRadius: "999px", color: "#fff", fontSize: "11px", fontWeight: 800, padding: "3px 8px" }}>
                        {t("config.selected")}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 750, fontSize: "14px", marginTop: "12px", color: "#111827" }}>{t("config.custom.title")}</div>
                  <div style={{ ...mutedText, marginTop: "5px" }}>{t("config.custom.desc")}</div>
                </button>
              );
            })()}
        </div>

        {/* File upload area — shown only when custom is selected */}
        {selectedSound === "custom" && (
          <div
            style={{
              marginTop: "16px",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "20px",
              background: "#fafafa",
            }}
          >
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#111827", marginBottom: "4px" }}>
                {t("config.upload.title")}
              </div>
              <div style={{ ...mutedText }}>{t("config.upload.formats")}</div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/ogg,audio/mp4,audio/aac,audio/x-wav"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {/* Not yet uploaded */}
            {!customSoundUrl && !isUploading && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  ...secondaryButton,
                  gap: "8px",
                }}
              >
                {t("config.upload.choose")}
              </button>
            )}

            {/* Uploading */}
            {isUploading && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    border: "2px solid #e5e7eb",
                    borderTopColor: "#111827",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                <span style={{ fontSize: "13px", color: "#374151" }}>
                  {t("config.upload.uploading", { name: customFileName })}
                </span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* Upload done */}
            {customSoundUrl && !isUploading && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#dcfce7",
                    border: "1px solid #86efac",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    color: "#166534",
                    fontWeight: 600,
                  }}
                >
                  <span>✓</span>
                  <span style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {customFileName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => playSound("custom")}
                  style={{ ...secondaryButton, gap: "6px", fontSize: "13px" }}
                >
                  {t("config.upload.preview")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomSoundUrl(null);
                    setCustomFileName("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  style={{ ...secondaryButton, color: "#b42318", borderColor: "#f1b7b0", fontSize: "13px" }}
                >
                  {t("config.upload.remove")}
                </button>
              </div>
            )}

            {/* Upload error */}
            {uploadFetcher.state === "idle" && uploadFetcher.data?.error && !customSoundUrl && (
              <div style={{ marginTop: "10px", color: "#b42318", fontSize: "13px" }}>
                {uploadFetcher.data.error}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ marginLeft: "10px", ...secondaryButton, fontSize: "12px", minHeight: "30px", padding: "0 10px" }}
                >
                  {t("config.upload.tryAgain")}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <section style={stepCardStyle}>
        <div style={{ marginBottom: "16px" }}>
          <h2 style={sectionTitle}>{t("config.step3.title")}</h2>
          <p style={{ ...mutedText, margin: 0 }}>
            {canAdd
              ? t("config.step3.descReady")
              : selectedSound === "custom" && !customSoundUrl
                ? t("config.step3.descUpload")
                : isPremium
                  ? t("config.step3.descPremium")
                  : t("config.step3.descBasic")}
          </p>
        </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                gap: "20px",
                alignItems: "stretch",
              }}
            >
              <button
                type="button"
                onClick={handlePreview}
                disabled={!canAdd || isPlaying}
                style={{
                  ...card,
                  background: "#f8fafc",
                  padding: "18px",
                  cursor: !canAdd || isPlaying ? "not-allowed" : "pointer",
                  minHeight: "230px",
                  opacity: canAdd ? 1 : 0.72,
                  textAlign: "center",
                }}
              >
                <div
                  ref={previewBoxRef}
                  style={{
                    width: "100%",
                    height: "220px",
                    margin: "0",
                    background: "linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)",
                    border: "1px solid #e3e3e3",
                    borderRadius: "14px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.8), 0 10px 24px rgba(0,0,0,0.08)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "24px",
                      top: "50%",
                      width: "54px",
                      height: "54px",
                      transform: "translateY(-50%)",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg,#f8fafc 0%,#ffffff 48%,#e9f5ff 100%)",
                      border: "2px solid #ffffff",
                      boxShadow: "0 10px 22px rgba(17,24,39,0.16)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "#111827", position: "relative", boxShadow: "inset 0 -8px 0 rgba(255,255,255,0.14)" }}>
                      <div style={{ position: "absolute", left: "8px", right: "8px", top: "-6px", height: "12px", border: "2px solid #111827", borderBottom: 0, borderRadius: "12px 12px 0 0" }} />
                      <div style={{ position: "absolute", left: "10px", top: "12px", width: "14px", height: "3px", borderRadius: "999px", background: "#ffffff" }} />
                    </div>
                  </div>
                  <div
                    ref={cartRef}
                    style={{
                      width: "74px",
                      height: "74px",
                      borderRadius: "20px",
                      background: "#111827",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "40px",
                      lineHeight: "1",
                      boxShadow: "0 16px 30px rgba(17,24,39,0.22)",
                    }}
                  >
                    🛒
                  </div>
                </div>
                <div style={{ marginTop: "14px", fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                  {!canAdd
                    ? isPremium ? t("config.preview.selectPremium") : t("config.preview.selectBasic")
                    : isPlaying
                      ? t("config.preview.playing")
                      : selectedAnimation
                        ? t("config.preview.animation")
                        : t("config.preview.sound")}
                </div>
                <div style={{ marginTop: "4px", fontSize: "12px", color: "#6b7280" }}>
                  {!canAdd
                    ? isPremium ? t("config.preview.unlockPremium") : t("config.preview.unlockBasic")
                    : selectedAnimation && selectedSound
                      ? t("config.preview.playsBoth")
                      : selectedAnimation
                        ? t("config.preview.playsAnim")
                        : t("config.preview.playsSound")}
                </div>
              </button>

              <div
                style={{
                  ...card,
                  padding: "20px",
                  minHeight: "230px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
                }}
              >
                <div>
                  <div style={{ ...mutedText, fontWeight: 800, marginBottom: "12px", textTransform: "uppercase" }}>
                    {t("config.selected.combination")}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ border: "1px solid #ececec", borderRadius: "10px", padding: "14px", background: "#fafafa" }}>
                      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{selectedAnimationOption?.emoji ?? "—"}</div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: selectedAnimationOption ? "#111827" : "#9ca3af" }}>
                        {selectedAnimationOption?.name ?? t("config.selected.noAnimation")}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>{t("config.selected.animationLabel")}</div>
                    </div>
                    <div style={{ border: "1px solid #ececec", borderRadius: "10px", padding: "14px", background: "#fafafa" }}>
                      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{selectedSoundOption?.emoji ?? "—"}</div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: selectedSoundOption ? "#111827" : "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {selectedSoundOption?.name ?? t("config.selected.noSound")}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>{t("config.selected.soundLabel")}</div>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#4b5563", lineHeight: "1.5" }}>
                    {t("config.selected.saveNote")}
                  </p>
                </div>

                <Form method="POST" style={{ marginTop: "18px" }}>
                  <input type="hidden" name="animationKey" value={selectedAnimation ?? ""} />
                  <input type="hidden" name="soundKey" value={selectedSound ?? ""} />
                  {selectedSound === "custom" && customSoundUrl && (
                    <input type="hidden" name="customSoundUrl" value={customSoundUrl} />
                  )}
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={handlePreview}
                      disabled={!canAdd || isPlaying}
                      style={{
                        ...secondaryButton,
                        minHeight: "40px",
                        cursor: !canAdd || isPlaying ? "not-allowed" : "pointer",
                        opacity: !canAdd ? 0.55 : 1,
                      }}
                    >
                      {isPlaying ? t("config.btn.playing") : t("config.btn.preview")}
                    </button>
                    <button
                      type="submit"
                      disabled={!canAdd || isSaving}
                      style={{
                        ...primaryButton,
                        minHeight: "40px",
                        background: isSaving ? "#8a8a8a" : "#111827",
                        cursor: !canAdd || isSaving ? "not-allowed" : "pointer",
                        opacity: !canAdd ? 0.55 : 1,
                      }}
                    >
                      {isSaving ? t("config.btn.saving") : t("config.btn.add")}
                    </button>
                  </div>
                </Form>
              </div>
            </div>
      </section>
      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
