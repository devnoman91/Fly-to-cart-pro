import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { requireEntitlements } from "../services/billing.server";
import { fetchConfigurations } from "../utils/shopify-graphql";
import { useT, type TFunction } from "../i18n/context";
import {
  badge,
  card,
  cardPadding,
  mutedText,
  pageShell,
  primaryButton,
  secondaryButton,
  sectionTitle,
} from "../styles/ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const { tier, isPremium, inTrial } = await requireEntitlements(session.shop, request);
  const configs = await fetchConfigurations(admin);
  const liveConfig = configs.find((config) => config.live) ?? null;
  return { liveConfig, totalCount: configs.length, shop: session?.shop, tier, isPremium, inTrial };
};

const ANIMATION_NAMES: Record<string, string> = {
  slide_in: "Slide In",
  bounce: "Bounce",
  flip: "Flip",
  pulse: "Pulse",
  spiral: "Spiral",
  zoom: "Zoom",
  shake: "Shake",
  float: "Float",
};

const SOUND_NAMES: Record<string, string> = {
  chime: "Chime",
  whoosh: "Whoosh",
  pop: "Pop",
  bell: "Bell",
  sparkle: "Sparkle",
  coin: "Coin",
  laser: "Laser",
  drum: "Drum",
  custom: "Custom sound",
};

// A live config may be animation only, sound only, or both.
function liveSummary(config: { animationKey: string; soundKey: string }, t: TFunction) {
  const animation = config.animationKey
    ? (ANIMATION_NAMES[config.animationKey] ?? config.animationKey)
    : null;
  const sound = config.soundKey ? (SOUND_NAMES[config.soundKey] ?? config.soundKey) : null;

  if (animation && sound) return t("home.summary.both", { animation, sound });
  if (animation) return t("home.summary.animationOnly", { animation });
  if (sound) return t("home.summary.soundOnly", { sound });
  return t("home.summary.empty");
}

export default function Index() {
  const { liveConfig, totalCount, shop, tier, isPremium, inTrial } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const t = useT();
  const hasConfigs = totalCount > 0;
  const isLive = Boolean(liveConfig);

  const planLabel = inTrial
    ? t("home.plan.trial")
    : tier === "premium"
      ? t("home.plan.premium")
      : t("home.plan.basic");

  const API_KEY = "9620563a9ea6bc8e3f91ec87e893f4e8";
  const EMBED_HANDLE = "app_embed";
  const appEmbedDeepLink = `https://${shop}/admin/themes/current/editor?context=apps&activateAppId=${API_KEY}/${EMBED_HANDLE}`;

  const steps = [
    {
      title: t("home.step1.title"),
      description: t("home.step1.desc"),
      complete: hasConfigs,
      action: t("home.step1.action"),
      onClick: () => navigate("/app/configure"),
    },
    {
      title: t("home.step2.title"),
      description: t("home.step2.desc"),
      complete: isLive,
      action: t("home.step2.action"),
      onClick: () => navigate("/app/animations"),
    },
    {
      title: t("home.step3.title"),
      description: t("home.step3.desc"),
      complete: false,
      action: t("home.step3.action"),
      href: appEmbedDeepLink,
    },
  ];

  const completedSteps = steps.filter((step) => step.complete).length;
  const progress = Math.round((completedSteps / steps.length) * 100);

  return (
    <s-page heading={t("home.pageHeading")}>
      <s-button
        slot="primary-action"
        onClick={() => navigate(hasConfigs ? "/app/animations" : "/app/configure")}
      >
        {hasConfigs ? t("home.primary.manage") : t("home.primary.create")}
      </s-button>

      <div style={pageShell}>
        <div
          style={{
            ...card,
            marginBottom: "16px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.3fr) minmax(260px, 0.7fr)",
              gap: "1px",
              background: "#d7d7d7",
            }}
          >
            <div style={{ background: "#fff", padding: "24px" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
                <span
                  style={{
                    ...badge,
                    background: isLive ? "#dcfce7" : "#fef3c7",
                    border: isLive ? "1px solid #86efac" : "1px solid #fcd34d",
                    color: isLive ? "#166534" : "#92400e",
                  }}
                >
                  {isLive ? t("home.badge.live") : t("home.badge.setup")}
                </span>
                <span
                  style={{
                    ...badge,
                    background: isPremium ? "#eef2ff" : "#f3f4f6",
                    border: isPremium ? "1px solid #c7d2fe" : "1px solid #e5e7eb",
                    color: isPremium ? "#4338ca" : "#374151",
                  }}
                >
                  {planLabel}
                </span>
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: "24px", lineHeight: "1.2" }}>
                {isLive ? t("home.hero.titleLive") : t("home.hero.titleSetup")}
              </h2>
              <p style={{ ...mutedText, margin: "0 0 18px", maxWidth: "620px" }}>
                {isLive && liveConfig
                  ? t("home.hero.descLive", { summary: liveSummary(liveConfig, t) })
                  : hasConfigs
                    ? totalCount === 1
                      ? t("home.hero.descConfigsOne")
                      : t("home.hero.descConfigsMany", { count: totalCount })
                    : t("home.hero.descEmpty")}
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={primaryButton}
                  onClick={() => navigate(hasConfigs ? "/app/animations" : "/app/configure")}
                >
                  {hasConfigs ? t("home.primary.manage") : t("home.hero.startSetup")}
                </button>
                <a href={appEmbedDeepLink} target="_blank" rel="noreferrer" style={secondaryButton}>
                  {t("home.hero.themeEditor")}
                </a>
              </div>
            </div>
            <div style={{ background: "#fafafa", padding: "24px" }}>
              <div style={{ ...mutedText, marginBottom: "10px", fontWeight: 700 }}>
                {t("home.progress.title")}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "14px" }}>
                <span style={{ fontSize: "38px", fontWeight: 850, lineHeight: 1 }}>{completedSteps}</span>
                <span style={{ color: "#6b7280", fontSize: "14px" }}>{t("home.progress.ofComplete", { total: steps.length })}</span>
              </div>
              <div style={{ background: "#e5e7eb", borderRadius: "999px", height: "8px", overflow: "hidden" }}>
                <div
                  style={{
                    background: "#111827",
                    borderRadius: "999px",
                    height: "100%",
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...cardPadding, marginBottom: "16px" }}>
          <div style={{ marginBottom: "18px" }}>
            <h2 style={sectionTitle}>{t("home.guide.title")}</h2>
            <p style={{ ...mutedText, margin: 0 }}>{t("home.guide.desc")}</p>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {steps.map((step, index) => (
              <div
                key={step.title}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  display: "grid",
                  gridTemplateColumns: "36px minmax(0,1fr) auto",
                  gap: "12px",
                  padding: "14px",
                  alignItems: "center",
                  background: step.complete ? "#fbfdfb" : "#fff",
                }}
              >
                <div
                  style={{
                    alignItems: "center",
                    background: step.complete ? "#111827" : "#f3f4f6",
                    borderRadius: "999px",
                    color: step.complete ? "#fff" : "#6b7280",
                    display: "flex",
                    fontSize: "13px",
                    fontWeight: 800,
                    height: "32px",
                    justifyContent: "center",
                    width: "32px",
                  }}
                >
                  {step.complete ? "✓" : index + 1}
                </div>
                <div>
                  <div style={{ color: "#111827", fontSize: "14px", fontWeight: 750 }}>{step.title}</div>
                  <div style={{ ...mutedText, marginTop: "3px" }}>{step.description}</div>
                </div>
                {"href" in step ? (
                  <a href={step.href} target="_blank" rel="noreferrer" style={secondaryButton}>
                    {step.action}
                  </a>
                ) : (
                  <button type="button" style={secondaryButton} onClick={step.onClick}>
                    {step.action}
                  </button>
                )}
              </div>
            ))}
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
            <div>
              <h3 style={{ ...sectionTitle, color: "#1e1b4b" }}>{t("home.upgrade.title")}</h3>
              <p style={{ margin: 0, color: "#3730a3", fontSize: "13px", lineHeight: 1.5 }}>
                {t("home.upgrade.desc")}
              </p>
            </div>
            <button type="button" style={primaryButton} onClick={() => navigate("/app/billing")}>
              {t("home.upgrade.cta")}
            </button>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          <div style={cardPadding}>
            <h3 style={sectionTitle}>{t("home.saved.title")}</h3>
            <p style={{ ...mutedText, margin: "0 0 14px" }}>
              {totalCount === 0
                ? t("home.saved.none")
                : totalCount === 1
                  ? t("home.saved.countOne")
                  : t("home.saved.countMany", { count: totalCount })}
            </p>
            <button type="button" style={secondaryButton} onClick={() => navigate("/app/animations")}>
              {t("home.saved.view")}
            </button>
          </div>
          <div style={cardPadding}>
            <h3 style={sectionTitle}>{t("home.help.title")}</h3>
            <p style={{ ...mutedText, margin: "0 0 14px" }}>
              {t("home.help.desc")}
            </p>
            <button type="button" style={secondaryButton} onClick={() => navigate("/app/help")}>
              {t("home.help.open")}
            </button>
          </div>
        </div>
      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
