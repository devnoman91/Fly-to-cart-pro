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
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
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
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const configs = await fetchConfigurations(admin);
  return { configs };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return { success: false, error: "Invalid method" };
  }

  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id");

  try {
    const configs = await fetchConfigurations(admin);
    let nextConfigs: FtcConfig[];

    if (intent === "set_live" && typeof id === "string") {
      nextConfigs = configs.map((config) => ({
        ...config,
        live: config.id === id,
      }));
    } else if (intent === "stop") {
      nextConfigs = configs.map((config) => ({ ...config, live: false }));
    } else if (intent === "delete" && typeof id === "string") {
      nextConfigs = configs.filter((config) => config.id !== id);
    } else {
      return { success: false, error: "Unknown action" };
    }

    await saveConfigurations(admin, nextConfigs);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update animations" };
  }
};

function getAnimation(key: string) {
  return ANIMATIONS[key] ?? { name: key, icon: "?", color: "#111827" };
}

function getSound(key: string) {
  return SOUNDS[key] ?? { name: key, icon: "?" };
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
  const isSubmitting = navigation.state === "submitting";
  const liveConfig = configs.find((config) => config.live);

  return (
    <s-page heading="My Animations">
      <s-button slot="primary-action" onClick={() => navigate("/app/configure")}>
        Create Animation
      </s-button>
      <s-link slot="breadcrumbs" onClick={() => navigate("/app")}>Home</s-link>

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
            <div style={{ ...mutedText, marginBottom: "6px" }}>Saved</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#111827" }}>{configs.length}</div>
          </div>
          <div style={{ ...card, padding: "16px" }}>
            <div style={{ ...mutedText, marginBottom: "6px" }}>Live animation</div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: liveConfig ? "#111827" : "#6b7280" }}>
              {liveConfig
                ? `${getAnimation(liveConfig.animationKey).name} + ${getSound(liveConfig.soundKey).name}`
                : "None active"}
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
                No animations saved yet
              </h2>
              <p style={{ margin: "0 0 18px", color: "#6b7280", fontSize: "14px" }}>
                Create your first add-to-cart animation and sound combination.
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
                Create Animation
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {configs.map((config, index) => {
              const animation = getAnimation(config.animationKey);
              const sound = getSound(config.soundKey);

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
                      {animation.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <h2 style={{ margin: 0, fontSize: "17px", color: "#111827" }}>
                          {animation.name} + {sound.name}
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
                            Live
                          </span>
                        )}
                      </div>
                      <div style={{ color: "#6b7280", fontSize: "13px", marginTop: "6px" }}>
                        Animation #{index + 1} · Sound {sound.icon} {sound.name}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {config.live ? (
                      <Form method="POST">
                        <input type="hidden" name="intent" value="stop" />
                        <ActionButton disabled={isSubmitting}>Stop</ActionButton>
                      </Form>
                    ) : (
                      <Form method="POST">
                        <input type="hidden" name="intent" value="set_live" />
                        <input type="hidden" name="id" value={config.id} />
                        <ActionButton disabled={isSubmitting} tone="primary">
                          Set Live
                        </ActionButton>
                      </Form>
                    )}
                    <Form method="POST">
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="id" value={config.id} />
                      <ActionButton disabled={isSubmitting} tone="critical">
                        Delete
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
