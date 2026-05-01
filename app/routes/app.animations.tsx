import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { fetchAnimationPresets, createAnimationPreset } from "../utils/shopify-graphql";

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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const animations = await fetchAnimationPresets(admin);
    return { animations, predefined: PREDEFINED_ANIMATIONS };
  } catch (error) {
    return { animations: [], predefined: PREDEFINED_ANIMATIONS };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return null;
  }

  const { admin } = await authenticate.admin(request);

  try {
    const formData = await request.formData();
    const animationKey = formData.get("animationKey") as string;

    const animation = PREDEFINED_ANIMATIONS.find(
      (a) => a.key === animationKey
    );

    if (!animation) return null;

    await createAnimationPreset(admin, {
      name: animation.name,
      key: animation.key,
      duration: animation.duration,
      previewJson: "{}",
      enabled: true,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to create animation:", error);
    return null;
  }
};

export default function AnimationsPage() {
  const { predefined } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Pick Animation Style">
      <s-button slot="primary-action" onClick={() => window.history.back()}>
        Back
      </s-button>

      <s-section heading="Available Animations">
        <s-stack direction="block" gap="base">
          {predefined.map((animation) => (
            <form key={animation.key} method="POST">
              <input type="hidden" name="animationKey" value={animation.key} />
              <s-box
                padding="loose"
                borderWidth="base"
                style={{ cursor: "pointer", marginBottom: "16px" }}
              >
                <s-stack direction="block" gap="base">
                  <div>
                    <s-text variant="headingSm">{animation.name}</s-text>
                    <s-text tone="subdued" style={{ fontSize: "14px" }}>
                      {animation.description}
                    </s-text>
                    <s-text tone="subdued" style={{ fontSize: "12px", marginTop: "8px" }}>
                      Duration: {animation.duration}ms
                    </s-text>
                  </div>
                  <s-button type="submit">Select</s-button>
                </s-stack>
              </s-box>
            </form>
          ))}
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs: any) => {
  return boundary.headers(headersArgs);
};
