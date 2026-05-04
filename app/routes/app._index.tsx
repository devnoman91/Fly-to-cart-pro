import type {
  HeadersFunction,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

export default function Index() {

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
              <s-text>1. Choose your favorite animation and sound together</s-text>
              <s-text>2. Preview how it looks and sounds</s-text>
              <s-text>3. Done! Animations play when customers add to cart</s-text>
            </s-stack>
          </s-stack>
        </s-box>
      </s-section>

      <s-section heading="Get Started">
        <s-box padding="loose" background="highlight">
          <s-stack direction="block" gap="base">
            <s-text variant="headingMd">Ready to add magic to your store?</s-text>
            <s-paragraph>
              Select your preferred animation and sound, preview the effect, and apply it to your store in seconds.
            </s-paragraph>
            <s-button onClick={() => (window.location.href = "/app/configure")} style={{ backgroundColor: "#0066cc", color: "white" }}>
              Configure Now
            </s-button>
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
