import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  fetchAnimationPresets,
  fetchSoundPresets,
  fetchProductsWithAnimations,
} from "../utils/shopify-graphql";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const animations = await fetchAnimationPresets(admin);
    const sounds = await fetchSoundPresets(admin);
    const productsData = await fetchProductsWithAnimations(admin, 100);

    return {
      totalAnimations: animations.length,
      totalSounds: sounds.length,
      totalProducts: productsData.nodes?.length || 0,
    };
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return {
      totalAnimations: 0,
      totalSounds: 0,
      totalProducts: 0,
    };
  }
};

export default function Index() {
  const { totalAnimations, totalSounds, totalProducts } =
    useLoaderData<typeof loader>();

  return (
    <s-page heading="Fly To Cart Pro - Setup">
      <s-section heading="Welcome to Fly To Cart Pro">
        <s-box padding="loose" borderWidth="base" background="highlight">
          <s-stack direction="block" gap="base">
            <s-text variant="headingMd">
              Create Engaging Add-to-Cart Experiences
            </s-text>
            <s-paragraph>
              Your customers will see beautiful animations and hear satisfying sounds when they add products to cart.
              This boosts engagement and creates a memorable shopping experience.
            </s-paragraph>

            <s-stack direction="block" gap="tight">
              <s-text variant="headingSm">How it works:</s-text>
              <s-text>1. Pick your favorite animation style</s-text>
              <s-text>2. Pick a sound effect</s-text>
              <s-text>3. Apply to your products</s-text>
              <s-text>4. Done! Animations play on add-to-cart</s-text>
            </s-stack>
          </s-stack>
        </s-box>
      </s-section>

      <s-section heading="Setup Your Store">
        <s-box padding="loose">
          <s-stack direction="block" gap="base">
            <div>
              <s-text variant="headingSm">Step 1: Choose Animation Style</s-text>
              <s-paragraph tone="subdued">
                {totalAnimations > 0
                  ? `${totalAnimations} animations available`
                  : "No animations yet"}
              </s-paragraph>
              <s-button onClick={() => (window.location.href = "/app/animations")}>
                Pick Animation
              </s-button>
            </div>

            <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "16px" }}>
              <s-text variant="headingSm">Step 2: Choose Sound Effect</s-text>
              <s-paragraph tone="subdued">
                {totalSounds > 0
                  ? `${totalSounds} sounds available`
                  : "No sounds yet"}
              </s-paragraph>
              <s-button onClick={() => (window.location.href = "/app/sounds")}>
                Pick Sound
              </s-button>
            </div>

            <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "16px" }}>
              <s-text variant="headingSm">Step 3: Apply to Products</s-text>
              <s-paragraph tone="subdued">
                {totalProducts > 0
                  ? `${totalProducts} products available`
                  : "No products yet"}
              </s-paragraph>
              <s-button onClick={() => (window.location.href = "/app/products")}>
                Configure Products
              </s-button>
            </div>
          </s-stack>
        </s-box>
      </s-section>

      <s-section heading="5 Animation Styles">
        <s-stack direction="block" gap="base">
          <div>
            <s-text variant="headingSm">Slide In</s-text>
            <s-text tone="subdued">Product slides smoothly to cart (professional)</s-text>
          </div>
          <div>
            <s-text variant="headingSm">Bounce</s-text>
            <s-text tone="subdued">Product bounces elastically (playful)</s-text>
          </div>
          <div>
            <s-text variant="headingSm">Flip</s-text>
            <s-text tone="subdued">Product rotates 360° (modern)</s-text>
          </div>
          <div>
            <s-text variant="headingSm">Pulse</s-text>
            <s-text tone="subdued">Cart icon pulses (subtle)</s-text>
          </div>
          <div>
            <s-text variant="headingSm">Spiral</s-text>
            <s-text tone="subdued">Product spirals upward (premium)</s-text>
          </div>
        </s-stack>
      </s-section>

      <s-section heading="5 Sound Effects">
        <s-stack direction="block" gap="base">
          <div>
            <s-text variant="headingSm">Chime</s-text>
            <s-text tone="subdued">Pleasant notification sound</s-text>
          </div>
          <div>
            <s-text variant="headingSm">Whoosh</s-text>
            <s-text tone="subdued">Smooth transition sound</s-text>
          </div>
          <div>
            <s-text variant="headingSm">Pop</s-text>
            <s-text tone="subdued">Playful bubble pop</s-text>
          </div>
          <div>
            <s-text variant="headingSm">Bell</s-text>
            <s-text tone="subdued">Ringing bell notification</s-text>
          </div>
          <div>
            <s-text variant="headingSm">Sparkle</s-text>
            <s-text tone="subdued">Magical tinkling sound</s-text>
          </div>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
