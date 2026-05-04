import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate, unauthenticated } from "../shopify.server";
import prisma from "../db.server";
import { fetchConfigurations } from "../utils/shopify-graphql";

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
  try {
    const admin = await getAdmin(request);
    const configs = await fetchConfigurations(admin);
    const liveConfig = configs.find((c) => c.live) ?? null;
    return { configs, liveConfig, totalCount: configs.length };
  } catch {
    return { configs: [], liveConfig: null, totalCount: 0 };
  }
};

const ANIMATION_NAMES: Record<string, string> = {
  slide_in: "Slide In", bounce: "Bounce", flip: "Flip", pulse: "Pulse", spiral: "Spiral",
};
const SOUND_NAMES: Record<string, string> = {
  chime: "Chime", whoosh: "Whoosh", pop: "Pop", bell: "Bell", sparkle: "Sparkle",
};
const ANIMATION_EMOJI: Record<string, string> = {
  slide_in: "➡️", bounce: "🏀", flip: "🔄", pulse: "💫", spiral: "🌀",
};
const SOUND_EMOJI: Record<string, string> = {
  chime: "🔔", whoosh: "💨", pop: "🫧", bell: "🛎️", sparkle: "✨",
};

export default function Index() {
  const { liveConfig, totalCount } = useLoaderData<typeof loader>();

  const hasConfigs = totalCount > 0;
  const isLive     = !!liveConfig;

  const steps = [
    {
      num: 1,
      title: "Create an animation",
      desc: "Pick an animation style and a sound effect, then preview the combination.",
      done: hasConfigs,
      action: { label: "Go to Configure", href: "/app/configure" },
    },
    {
      num: 2,
      title: "Set it live on your store",
      desc: "Open My Animations and click Set Live on your chosen combination.",
      done: isLive,
      action: { label: "My Animations", href: "/app/animations" },
    },
    {
      num: 3,
      title: "Enable the app embed",
      desc: "In your Shopify theme editor, go to App Embeds and turn on Fly-to-Cart Pro.",
      done: false,
      action: null,
    },
  ];

  const completedSteps = steps.filter((s) => s.done).length;
  const allDone        = completedSteps === steps.length - 1; // step 3 can't be verified

  return (
    <s-page heading="Fly to Cart Pro">

      <style>{`
        .ftc-hero { background: linear-gradient(135deg, #0066cc 0%, #004999 100%); border-radius: 12px; padding: 36px; color: #fff; margin-bottom: 4px; }
        .ftc-hero h1 { margin: 0 0 8px; font-size: 26px; font-weight: 800; }
        .ftc-hero p  { margin: 0 0 24px; font-size: 15px; opacity: 0.88; max-width: 460px; line-height: 1.6; }
        .ftc-hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .ftc-btn-primary   { padding: 10px 24px; background: #fff; color: #0066cc; border: none; border-radius: 6px; font-size: 14px; font-weight: 700; cursor: pointer; }
        .ftc-btn-secondary { padding: 10px 24px; background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.5); border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }

        .ftc-status { display: flex; align-items: center; gap: 14px; padding: 16px 20px; border-radius: 10px; margin-bottom: 4px; }
        .ftc-status.live    { background: #f0fff4; border: 1px solid #28a745; }
        .ftc-status.offline { background: #fff8f0; border: 1px solid #fd7e14; }

        .ftc-steps { display: flex; flex-direction: column; gap: 12px; }
        .ftc-step  { display: flex; align-items: flex-start; gap: 16px; padding: 18px 20px; background: #fff; border: 1px solid #e8e8e8; border-radius: 10px; transition: box-shadow 0.15s; }
        .ftc-step.done { border-color: #28a745; background: #f7fff9; }
        .ftc-step-num  { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }
        .ftc-step-num.pending { background: #f0f0f0; color: #888; }
        .ftc-step-num.done    { background: #28a745; color: #fff; }
        .ftc-step-body { flex: 1; }
        .ftc-step-title { font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 3px; }
        .ftc-step-desc  { font-size: 13px; color: #666; line-height: 1.5; }
        .ftc-step-btn   { margin-top: 10px; padding: 7px 18px; background: #0066cc; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .ftc-step-done-badge { flex-shrink: 0; background: #e6f9ee; color: #28a745; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }

        .ftc-features { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
        .ftc-feature  { padding: 18px; background: #fff; border: 1px solid #e8e8e8; border-radius: 10px; text-align: center; }
        .ftc-feature-icon  { font-size: 32px; margin-bottom: 10px; }
        .ftc-feature-title { font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
        .ftc-feature-desc  { font-size: 12px; color: #888; line-height: 1.4; }

        .ftc-progress-bar { height: 6px; background: #e8e8e8; border-radius: 3px; margin-top: 12px; overflow: hidden; }
        .ftc-progress-fill { height: 100%; background: #28a745; border-radius: 3px; transition: width 0.4s; }
      `}</style>

      {/* Hero */}
      <s-section heading="">
        <div className="ftc-hero">
          <h1>🛒 Fly to Cart Pro</h1>
          <p>Boost engagement with beautiful add-to-cart animations and satisfying sound effects — no coding required.</p>
          <div className="ftc-hero-actions">
            <button className="ftc-btn-primary" onClick={() => (window.location.href = "/app/configure")}>
              Create Animation
            </button>
            <button className="ftc-btn-secondary" onClick={() => (window.location.href = "/app/animations")}>
              My Animations
            </button>
          </div>
        </div>
      </s-section>

      {/* Live status */}
      <s-section heading="">
        <div className={`ftc-status ${isLive ? "live" : "offline"}`}>
          <div style={{ fontSize: "24px" }}>{isLive ? "🟢" : "🟡"}</div>
          {isLive ? (
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#1a7f3c" }}>Active on your store</div>
              <div style={{ fontSize: "13px", color: "#333", marginTop: "2px" }}>
                {ANIMATION_EMOJI[liveConfig!.animationKey]}{" "}
                {ANIMATION_NAMES[liveConfig!.animationKey]} + {SOUND_EMOJI[liveConfig!.soundKey]}{" "}
                {SOUND_NAMES[liveConfig!.soundKey]}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#c05000" }}>No animation is live</div>
              <div style={{ fontSize: "13px", color: "#666", marginTop: "2px" }}>
                {hasConfigs
                  ? `You have ${totalCount} saved animation${totalCount > 1 ? "s" : ""}. Set one live to activate it.`
                  : "Create your first animation to get started."}
              </div>
            </div>
          )}
          <button
            onClick={() => (window.location.href = isLive ? "/app/animations" : hasConfigs ? "/app/animations" : "/app/configure")}
            style={{ padding: "7px 18px", background: isLive ? "#28a745" : "#0066cc", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
          >
            {isLive ? "Manage" : hasConfigs ? "Set Live" : "Create Now"}
          </button>
        </div>
      </s-section>

      {/* Onboarding steps */}
      <s-section heading="Getting Started">
        <s-box padding="base">
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "13px", color: "#666" }}>
                {completedSteps} of {steps.length} steps completed
              </span>
              {allDone && (
                <span style={{ fontSize: "12px", background: "#e6f9ee", color: "#28a745", padding: "3px 10px", borderRadius: "20px", fontWeight: 700 }}>
                  Almost done!
                </span>
              )}
            </div>
            <div className="ftc-progress-bar">
              <div className="ftc-progress-fill" style={{ width: `${(completedSteps / steps.length) * 100}%` }} />
            </div>
          </div>

          <div className="ftc-steps">
            {steps.map((step) => (
              <div key={step.num} className={`ftc-step ${step.done ? "done" : ""}`}>
                <div className={`ftc-step-num ${step.done ? "done" : "pending"}`}>
                  {step.done ? "✓" : step.num}
                </div>
                <div className="ftc-step-body">
                  <div className="ftc-step-title">{step.title}</div>
                  <div className="ftc-step-desc">{step.desc}</div>
                  {!step.done && step.action && (
                    <button
                      className="ftc-step-btn"
                      onClick={() => (window.location.href = step.action!.href)}
                    >
                      {step.action.label} →
                    </button>
                  )}
                </div>
                {step.done && <div className="ftc-step-done-badge">✓ Done</div>}
              </div>
            ))}
          </div>
        </s-box>
      </s-section>

      {/* Feature highlights */}
      <s-section heading="What You Get">
        <s-box padding="base">
          <div className="ftc-features">
            {[
              { icon: "➡️", title: "Slide In",  desc: "Product slides smoothly to the cart" },
              { icon: "🏀", title: "Bounce",    desc: "Elastic bouncing animation" },
              { icon: "🔄", title: "Flip",      desc: "360° rotation while flying" },
              { icon: "💫", title: "Pulse",     desc: "Cart icon pulses on add" },
              { icon: "🌀", title: "Spiral",    desc: "Spiraling upward effect" },
              { icon: "🔔", title: "Chime",     desc: "Pleasant chime sound" },
              { icon: "💨", title: "Whoosh",    desc: "Smooth swoosh transition" },
              { icon: "🫧", title: "Pop",       desc: "Playful bubble pop" },
              { icon: "🛎️", title: "Bell",      desc: "Classic ringing bell" },
              { icon: "✨", title: "Sparkle",   desc: "Magical tinkling effect" },
            ].map((f) => (
              <div key={f.title} className="ftc-feature">
                <div className="ftc-feature-icon">{f.icon}</div>
                <div className="ftc-feature-title">{f.title}</div>
                <div className="ftc-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </s-box>
      </s-section>

    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
