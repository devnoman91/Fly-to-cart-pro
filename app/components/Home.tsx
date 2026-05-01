import React from 'react';

interface HomeProps {
  totalAnimations: number;
  totalSounds: number;
  totalProducts: number;
}

export function Home({ totalAnimations, totalSounds, totalProducts }: HomeProps) {
  return (
    <s-page heading="Fly-to-Cart Pro">
      <s-section heading="Get Started">
        <s-paragraph>
          Create engaging add-to-cart experiences with custom animations and sounds for your Shopify store.
        </s-paragraph>
      </s-section>

      <s-section heading="Overview">
        <s-layout>
          <s-layout-section>
            <s-card>
              <s-box padding="loose">
                <s-stack direction="block" gap="base">
                  <s-text variant="headingMd">Animations</s-text>
                  <s-heading level="1">{totalAnimations}</s-heading>
                  <s-button onClick={() => window.location.href = '/app/animations'}>
                    Manage Animations
                  </s-button>
                </s-stack>
              </s-box>
            </s-card>
          </s-layout-section>

          <s-layout-section>
            <s-card>
              <s-box padding="loose">
                <s-stack direction="block" gap="base">
                  <s-text variant="headingMd">Sounds</s-text>
                  <s-heading level="1">{totalSounds}</s-heading>
                  <s-button onClick={() => window.location.href = '/app/sounds'}>
                    Manage Sounds
                  </s-button>
                </s-stack>
              </s-box>
            </s-card>
          </s-layout-section>

          <s-layout-section>
            <s-card>
              <s-box padding="loose">
                <s-stack direction="block" gap="base">
                  <s-text variant="headingMd">Products</s-text>
                  <s-heading level="1">{totalProducts}</s-heading>
                  <s-button onClick={() => window.location.href = '/app/products'}>
                    Configure Products
                  </s-button>
                </s-stack>
              </s-box>
            </s-card>
          </s-layout-section>
        </s-layout>
      </s-section>

      <s-section heading="Quick Start">
        <s-stack direction="block" gap="base">
          <s-text>
            1. Create animations in the Animations section
          </s-text>
          <s-text>
            2. Add sounds in the Sounds section
          </s-text>
          <s-text>
            3. Assign animations &amp; sounds to products
          </s-text>
          <s-text>
            4. Test on your store!
          </s-text>
        </s-stack>
      </s-section>
    </s-page>
  );
}
