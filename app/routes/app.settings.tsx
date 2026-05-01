import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { fetchGlobalSettings } from "../utils/shopify-graphql";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const settings = await fetchGlobalSettings(admin);
    return { settings: settings || {} };
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return { settings: {} };
  }
};

export default function SettingsPage() {
  const { settings } = useLoaderData<typeof loader>();

  const handleSave = () => {
    alert("Settings saved! (Feature coming soon)");
  };

  return (
    <s-page heading="Settings">
      <s-button slot="primary-action" onClick={handleSave}>
        Save Settings
      </s-button>

      <s-section heading="Global Configuration">
        <s-box padding="loose" borderWidth="base">
          <s-stack direction="block" gap="base">
            <div>
              <s-text variant="headingMd">Default Animation</s-text>
              <s-paragraph>
                Select the default animation for all products
              </s-paragraph>
              <s-select
                labelInline
                label="Animation"
                options={[
                  { label: "None", value: "none" },
                  { label: "Slide In", value: "slide_in" },
                  { label: "Bounce", value: "bounce" },
                  { label: "Flip", value: "flip" },
                  { label: "Pulse", value: "pulse" },
                  { label: "Spiral", value: "spiral" },
                ]}
              />
            </div>

            <div>
              <s-text variant="headingMd">Default Sound</s-text>
              <s-paragraph>
                Select the default sound for all products
              </s-paragraph>
              <s-select
                labelInline
                label="Sound"
                options={[
                  { label: "None", value: "none" },
                  { label: "Chime", value: "chime" },
                  { label: "Whoosh", value: "whoosh" },
                  { label: "Pop", value: "pop" },
                  { label: "Bell", value: "bell" },
                  { label: "Sparkle", value: "sparkle" },
                ]}
              />
            </div>

            <div>
              <s-checkbox label="Enable animations globally" defaultChecked />
            </div>
          </s-stack>
        </s-box>
      </s-section>

      <s-section heading="Theme Integration">
        <s-paragraph>
          The Fly-to-Cart Pro theme extension is automatically injected into your store.
        </s-paragraph>
        <s-box padding="loose" borderWidth="base" background="subdued">
          <s-stack direction="block" gap="base">
            <s-text>
              Status: <s-badge tone="success">Active</s-badge>
            </s-text>
            <s-text>
              Injected into: All product pages and cart
            </s-text>
          </s-stack>
        </s-box>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs: any) => {
  return boundary.headers(headersArgs);
};
