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
    return { liveConfig, totalCount: configs.length };
  } catch {
    return { liveConfig: null, totalCount: 0 };
  }
};

const ANIMATION_NAMES: Record<string, string> = {
  slide_in: "Slide In", bounce: "Bounce", flip: "Flip", pulse: "Pulse", spiral: "Spiral",
};
const SOUND_NAMES: Record<string, string> = {
  chime: "Chime", whoosh: "Whoosh", pop: "Pop", bell: "Bell", sparkle: "Sparkle",
};

export default function Index() {
  const { liveConfig, totalCount } = useLoaderData<typeof loader>();

  const hasConfigs = totalCount > 0;
  const isLive     = !!liveConfig;

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
      href: null,
      btnLabel: null,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <s-page heading="Fly to Cart Pro">
      <style>{`
        .ftc-header {
          padding: 28px 24px;
          border: 1px solid #e3e3e3;
          border-radius: 10px;
          background: #fff;
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .ftc-header-icon { font-size: 40px; flex-shrink: 0; }
        .ftc-header-text h2 { margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #1a1a1a; }
        .ftc-header-text p  { margin: 0; font-size: 13px; color: #666; line-height: 1.5; }

        .ftc-status {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 8px;
          border: 1px solid #e3e3e3;
          background: #fafafa;
        }
        .ftc-status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .ftc-status-dot.live    { background: #28a745; }
        .ftc-status-dot.offline { background: #ccc; }
        .ftc-status-label { font-size: 13px; color: #444; flex: 1; }
        .ftc-status-label strong { color: #1a1a1a; }
        .ftc-status-btn {
          padding: 6px 16px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid #d0d0d0;
          background: #fff;
          color: #333;
        }

        .ftc-progress { height: 4px; background: #eee; border-radius: 2px; overflow: hidden; margin-bottom: 16px; }
        .ftc-progress-bar { height: 100%; background: #1a1a1a; border-radius: 2px; transition: width 0.3s; }

        .ftc-steps { display: flex; flex-direction: column; gap: 2px; }
        .ftc-step {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px;
          border-radius: 8px;
          background: #fff;
          border: 1px solid #ececec;
        }
        .ftc-step + .ftc-step { margin-top: 8px; }
        .ftc-step.done { background: #fafafa; }

        .ftc-step-circle {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 2px solid #ddd;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
          color: #aaa;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .ftc-step-circle.done {
          background: #1a1a1a;
          border-color: #1a1a1a;
          color: #fff;
        }

        .ftc-step-title { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 2px; }
        .ftc-step-title.done { color: #888; text-decoration: line-through; }
        .ftc-step-desc  { font-size: 12px; color: #888; line-height: 1.5; }
        .ftc-step-btn {
          margin-top: 10px;
          padding: 7px 16px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid #1a1a1a;
          background: #1a1a1a;
          color: #fff;
          display: inline-block;
        }
      `}</style>

      {/* Header */}
      <s-section heading="">
        <div className="ftc-header">
          <div className="ftc-header-icon">🛒</div>
          <div className="ftc-header-text">
            <h2>Fly to Cart Pro</h2>
            <p>Add animations and sound effects when customers click Add to Cart.<br />No coding needed — set up in under a minute.</p>
          </div>
        </div>
      </s-section>

      {/* Status */}
      <s-section heading="Store Status">
        <div className="ftc-status">
          <div className={`ftc-status-dot ${isLive ? "live" : "offline"}`} />
          <div className="ftc-status-label">
            {isLive ? (
              <>
                <strong>
                  {ANIMATION_NAMES[liveConfig!.animationKey]} + {SOUND_NAMES[liveConfig!.soundKey]}
                </strong>{" "}is live on your store
              </>
            ) : hasConfigs ? (
              <>You have <strong>{totalCount} saved animation{totalCount > 1 ? "s" : ""}</strong> — none are live yet</>
            ) : (
              <>No animation configured yet</>
            )}
          </div>
          <button
            className="ftc-status-btn"
            onClick={() => (window.location.href = isLive || hasConfigs ? "/app/animations" : "/app/configure")}
          >
            {isLive ? "Manage" : hasConfigs ? "Set Live" : "Get Started"}
          </button>
        </div>
      </s-section>

      {/* Onboarding */}
      <s-section heading="Setup Guide">
        <s-box padding="base">
          <div style={{ marginBottom: "14px" }}>
            <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>
              {doneCount} of {steps.length} steps complete
            </div>
            <div className="ftc-progress">
              <div className="ftc-progress-bar" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
            </div>
          </div>

          <div className="ftc-steps">
            {steps.map((step) => (
              <div key={step.num} className={`ftc-step ${step.done ? "done" : ""}`}>
                <div className={`ftc-step-circle ${step.done ? "done" : ""}`}>
                  {step.done ? "✓" : step.num}
                </div>
                <div>
                  <div className={`ftc-step-title ${step.done ? "done" : ""}`}>{step.title}</div>
                  <div className="ftc-step-desc">{step.desc}</div>
                  {!step.done && step.href && (
                    <button
                      className="ftc-step-btn"
                      onClick={() => (window.location.href = step.href!)}
                    >
                      {step.btnLabel} →
                    </button>
                  )}
                </div>
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
