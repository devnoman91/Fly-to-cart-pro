import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { fetchConfigurations } from "../utils/shopify-graphql";
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
  const configs = await fetchConfigurations(admin);
  const liveConfig = configs.find((config) => config.live) ?? null;
  return { liveConfig, totalCount: configs.length, shop: session?.shop };
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
};

export default function Index() {
  const { liveConfig, totalCount, shop } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const hasConfigs = totalCount > 0;
  const isLive = Boolean(liveConfig);

  const API_KEY = "9620563a9ea6bc8e3f91ec87e893f4e8";
  const EMBED_HANDLE = "add-to-cart";
  const appEmbedDeepLink = `https://${shop}/admin/themes/current/editor?context=apps&activateAppId=${API_KEY}/${EMBED_HANDLE}`;

  const steps = [
    {
      title: "Create an animation",
      description: "Choose the animation and sound combination merchants will see on add to cart.",
      complete: hasConfigs,
      action: "Configure",
      onClick: () => navigate("/app/configure"),
    },
    {
      title: "Set one live",
      description: "Pick the saved combination that should run on the storefront.",
      complete: isLive,
      action: "My Animations",
      onClick: () => navigate("/app/animations"),
    },
    {
      title: "Enable app embed",
      description: "Turn on Fly to Cart Pro in the theme editor and save the theme.",
      complete: false,
      action: "Open Theme Editor",
      href: appEmbedDeepLink,
    },
  ];

  const completedSteps = steps.filter((step) => step.complete).length;
  const progress = Math.round((completedSteps / steps.length) * 100);

  return (
    <s-page heading="Fly to Cart Pro">
      <s-button
        slot="primary-action"
        onClick={() => navigate(hasConfigs ? "/app/animations" : "/app/configure")}
      >
        {hasConfigs ? "Manage Animations" : "Create Animation"}
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
              <div
                style={{
                  ...badge,
                  background: isLive ? "#dcfce7" : "#fef3c7",
                  border: isLive ? "1px solid #86efac" : "1px solid #fcd34d",
                  color: isLive ? "#166534" : "#92400e",
                  marginBottom: "14px",
                }}
              >
                {isLive ? "Live on storefront" : "Setup in progress"}
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: "24px", lineHeight: "1.2" }}>
                {isLive ? "Your add-to-cart effect is active" : "Finish setup to launch your first effect"}
              </h2>
              <p style={{ ...mutedText, margin: "0 0 18px", maxWidth: "620px" }}>
                {isLive && liveConfig
                  ? `${ANIMATION_NAMES[liveConfig.animationKey]} with ${SOUND_NAMES[liveConfig.soundKey]} is currently selected for your storefront.`
                  : hasConfigs
                    ? `You have ${totalCount} saved animation${totalCount === 1 ? "" : "s"}. Set one live, then enable the app embed.`
                    : "Create a polished animation and sound combo, set it live, and enable the app embed in your Shopify theme."}
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={primaryButton}
                  onClick={() => navigate(hasConfigs ? "/app/animations" : "/app/configure")}
                >
                  {hasConfigs ? "Manage Animations" : "Start Setup"}
                </button>
                <a href={appEmbedDeepLink} target="_blank" rel="noreferrer" style={secondaryButton}>
                  Theme Editor
                </a>
              </div>
            </div>
            <div style={{ background: "#fafafa", padding: "24px" }}>
              <div style={{ ...mutedText, marginBottom: "10px", fontWeight: 700 }}>
                Setup progress
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "14px" }}>
                <span style={{ fontSize: "38px", fontWeight: 850, lineHeight: 1 }}>{completedSteps}</span>
                <span style={{ color: "#6b7280", fontSize: "14px" }}>of {steps.length} complete</span>
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
            <h2 style={sectionTitle}>Setup guide</h2>
            <p style={{ ...mutedText, margin: 0 }}>Complete these steps in order. Each step keeps the merchant moving without leaving dead ends.</p>
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          <div style={cardPadding}>
            <h3 style={sectionTitle}>Saved animations</h3>
            <p style={{ ...mutedText, margin: "0 0 14px" }}>
              {totalCount === 0
                ? "No saved animations yet."
                : `${totalCount} saved animation${totalCount === 1 ? "" : "s"} ready to manage.`}
            </p>
            <button type="button" style={secondaryButton} onClick={() => navigate("/app/animations")}>
              View List
            </button>
          </div>
          <div style={cardPadding}>
            <h3 style={sectionTitle}>Need help?</h3>
            <p style={{ ...mutedText, margin: "0 0 14px" }}>
              Review setup instructions, troubleshooting, and support details.
            </p>
            <button type="button" style={secondaryButton} onClick={() => navigate("/app/help")}>
              Open Help
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
