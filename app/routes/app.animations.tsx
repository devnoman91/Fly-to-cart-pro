import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useRouteError,
} from "react-router";
import { useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { requireActiveSubscription, getEntitlements } from "../services/billing.server";
import { getServerT } from "../i18n";
import { useT, type TFunction } from "../i18n/context";
import {
  fetchConfigurations,
  saveConfigurations,
  type FtcConfig,
} from "../utils/shopify-graphql";
import { card, mutedText, pageShell } from "../styles/ui";

const ANIMATIONS: Record<string, { name: string; icon: string; color: string }> = {
  slide_in: { name: "Slide In", icon: "→", color: "#2563eb" },
  bounce: { name: "Bounce", icon: "↥", color: "#f59e0b" },
  flip: { name: "Flip", icon: "⟳", color: "#6366f1" },
  pulse: { name: "Pulse", icon: "◎", color: "#10b981" },
  spiral: { name: "Spiral", icon: "◌", color: "#8b5cf6" },
  zoom: { name: "Zoom", icon: "+", color: "#0ea5e9" },
  shake: { name: "Shake", icon: "≋", color: "#ef4444" },
  float: { name: "Float", icon: "↑", color: "#d97706" },
};

const SOUNDS: Record<string, { name: string; icon: string }> = {
  chime: { name: "Chime", icon: "♪" },
  whoosh: { name: "Whoosh", icon: "≈" },
  pop: { name: "Pop", icon: "•" },
  bell: { name: "Bell", icon: "!" },
  sparkle: { name: "Sparkle", icon: "*" },
  coin: { name: "Coin", icon: "$" },
  laser: { name: "Laser", icon: "/" },
  drum: { name: "Drum", icon: "●" },
  custom: { name: "Custom", icon: "🎵" },
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  await requireActiveSubscription(session.shop, request);
  const configs = await fetchConfigurations(admin);
  return { configs };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const t = getServerT(request);
  if (request.method !== "POST") {
    return { success: false, error: t("anim.error.invalidMethod") };
  }

  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id");

  try {
    const configs = await fetchConfigurations(admin);
    let nextConfigs: FtcConfig[];

    if (intent === "set_live" && typeof id === "string") {
      // A single-mode config (animation-only or sound-only) is a Premium effect.
      // Block a Basic shop from setting one live — otherwise a config saved during
      // trial could keep running Premium behavior on the storefront on the $5 plan.
      const target = configs.find((c) => c.id === id);
      const isSingleMode = target ? (!!target.animationKey) !== (!!target.soundKey) : false;
      if (isSingleMode) {
        const { isPremium } = await getEntitlements(session.shop);
        if (!isPremium) {
          return { success: false, error: t("anim.error.premiumSetLive") };
        }
      }
      nextConfigs = configs.map((config) => ({
        ...config,
        live: config.id === id,
      }));
    } else if (intent === "stop") {
      nextConfigs = configs.map((config) => ({ ...config, live: false }));
    } else if (intent === "delete" && typeof id === "string") {
      nextConfigs = configs.filter((config) => config.id !== id);
    } else {
      return { success: false, error: t("anim.error.unknown") };
    }

    await saveConfigurations(admin, nextConfigs);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error?.message || t("anim.error.updateFailed") };
  }
};

// A config may be animation only, sound only, or both — either key can be "".
// Effect proper names (Bounce, Chime, …) stay in English; only descriptive labels translate.
function getAnimation(key: string, t: TFunction) {
  if (!key) return { name: t("anim.noAnimation"), icon: "♪", color: "#64748b" };
  return ANIMATIONS[key] ?? { name: key, icon: "?", color: "#111827" };
}

function getSound(key: string, t: TFunction) {
  if (!key) return { name: t("anim.noSound"), icon: "—" };
  return SOUNDS[key] ?? { name: key, icon: "?" };
}

// "Bounce + Chime", "Bounce" (silent), or "Chime" (no motion)
function configLabel(config: { animationKey: string; soundKey: string }, t: TFunction) {
  const parts: string[] = [];
  if (config.animationKey) parts.push(getAnimation(config.animationKey, t).name);
  if (config.soundKey) parts.push(getSound(config.soundKey, t).name);
  return parts.join(" + ") || t("anim.configLabel.empty");
}

function configMode(config: { animationKey: string; soundKey: string }, t: TFunction) {
  if (config.animationKey && config.soundKey) return t("anim.mode.both");
  if (config.animationKey) return t("anim.mode.animationOnly");
  if (config.soundKey) return t("anim.mode.soundOnly");
  return t("anim.mode.none");
}

function ActionButton({
  children,
  disabled,
  tone = "secondary",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "critical";
}) {
  const styles = {
    primary: { background: "#111827", color: "#fff", border: "1px solid #111827" },
    secondary: { background: "#fff", color: "#111827", border: "1px solid #d7d7d7" },
    critical: { background: "#fff", color: "#b42318", border: "1px solid #f1b7b0" },
  }[tone];

  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        ...styles,
        borderRadius: "8px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "13px",
        fontWeight: 700,
        minHeight: "36px",
        padding: "0 14px",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default function AnimationsPage() {
  const { configs } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const shopify = useAppBridge();
  const t = useT();
  const isSubmitting = navigation.state === "submitting";
  const liveConfig = configs.find((config) => config.live);

  // Surface action results (e.g. a blocked Premium set-live) as a toast.
  useEffect(() => {
    if (!actionData) return;
    if (actionData.success === false && actionData.error) {
      shopify.toast.show(actionData.error, { isError: true, duration: 5000 });
    }
  }, [actionData]);

  return (
    <s-page heading={t("anim.pageHeading")}>
      <s-button slot="primary-action" onClick={() => navigate("/app/configure")}>
        {t("anim.create")}
      </s-button>

      <div style={pageShell}>
        {actionData?.success === false && actionData.error && (
          <div
            style={{
              marginBottom: "16px",
              border: "1px solid #f1b7b0",
              background: "#fff4f2",
              borderRadius: "8px",
              color: "#b42318",
              fontSize: "13px",
              padding: "12px 14px",
            }}
          >
            {actionData.error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div style={{ ...card, padding: "16px" }}>
            <div style={{ ...mutedText, marginBottom: "6px" }}>{t("anim.stat.saved")}</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#111827" }}>{configs.length}</div>
          </div>
          <div style={{ ...card, padding: "16px" }}>
            <div style={{ ...mutedText, marginBottom: "6px" }}>{t("anim.stat.live")}</div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: liveConfig ? "#111827" : "#6b7280" }}>
              {liveConfig ? configLabel(liveConfig, t) : t("anim.stat.none")}
            </div>
          </div>
        </div>

        {configs.length === 0 ? (
          <div
            style={{
              ...card,
              minHeight: "280px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "32px",
            }}
          >
            <div>
              <div style={{ fontSize: "44px", lineHeight: 1, marginBottom: "16px" }}>+</div>
              <h2 style={{ margin: "0 0 8px", fontSize: "20px", color: "#111827" }}>
                {t("anim.empty.title")}
              </h2>
              <p style={{ margin: "0 0 18px", color: "#6b7280", fontSize: "14px" }}>
                {t("anim.empty.desc")}
              </p>
              <Link
                to="/app/configure"
                style={{
                  background: "#111827",
                  borderRadius: "8px",
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: "38px",
                  padding: "0 16px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                {t("anim.create")}
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {configs.map((config, index) => {
              const animation = getAnimation(config.animationKey, t);
              const sound = getSound(config.soundKey, t);
              // Sound-only configs have no animation glyph — show the sound's instead
              const tileIcon = config.animationKey ? animation.icon : sound.icon;

              return (
                <div
                  key={config.id}
                  style={{
                    border: config.live ? "2px solid #111827" : "1px solid #d7d7d7",
                    borderRadius: "8px",
                    background: "#fff",
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    gap: "16px",
                    padding: "16px",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", gap: "14px", alignItems: "center", minWidth: 0 }}>
                    <div
                      style={{
                        width: "58px",
                        height: "58px",
                        borderRadius: "8px",
                        background: animation.color,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "30px",
                        fontWeight: 800,
                        flex: "0 0 auto",
                      }}
                    >
                      {tileIcon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <h2 style={{ margin: 0, fontSize: "17px", color: "#111827" }}>
                          {configLabel(config, t)}
                        </h2>
                        {config.live && (
                          <span
                            style={{
                              background: "#dcfce7",
                              border: "1px solid #86efac",
                              borderRadius: "999px",
                              color: "#166534",
                              fontSize: "11px",
                              fontWeight: 800,
                              padding: "3px 8px",
                            }}
                          >
                            {t("anim.badge.live")}
                          </span>
                        )}
                        {config.soundKey === "custom" && (
                          <span
                            style={{
                              background: "#eff6ff",
                              border: "1px solid #93c5fd",
                              borderRadius: "999px",
                              color: "#1d4ed8",
                              fontSize: "11px",
                              fontWeight: 800,
                              padding: "3px 8px",
                            }}
                          >
                            {t("anim.badge.custom")}
                          </span>
                        )}
                      </div>
                      <div style={{ color: "#6b7280", fontSize: "13px", marginTop: "6px" }}>
                        {t("anim.row.effect", { n: index + 1 })} · {configMode(config, t)}
                        {config.soundKey && (
                          <span style={{ marginLeft: "6px" }}>
                            · {t("anim.row.soundLabel")} {sound.icon} {sound.name}
                          </span>
                        )}
                        {config.customSoundUrl && (
                          <span style={{ marginLeft: "6px", color: "#9ca3af" }}>
                            · {t("anim.row.uploaded")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {config.live ? (
                      <Form method="POST">
                        <input type="hidden" name="intent" value="stop" />
                        <ActionButton disabled={isSubmitting}>{t("anim.btn.stop")}</ActionButton>
                      </Form>
                    ) : (
                      <Form method="POST">
                        <input type="hidden" name="intent" value="set_live" />
                        <input type="hidden" name="id" value={config.id} />
                        <ActionButton disabled={isSubmitting} tone="primary">
                          {t("anim.btn.setLive")}
                        </ActionButton>
                      </Form>
                    )}
                    <Form method="POST">
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="id" value={config.id} />
                      <ActionButton disabled={isSubmitting} tone="critical">
                        {t("anim.btn.delete")}
                      </ActionButton>
                    </Form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
