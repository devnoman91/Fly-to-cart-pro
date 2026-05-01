import React from 'react';

interface HomeProps {
  totalAnimations: number;
  totalSounds: number;
  totalProducts: number;
}

export function Home({ totalAnimations, totalSounds, totalProducts }: HomeProps) {
  const cardStyle = {
    display: 'inline-block',
    width: 'calc(33.33% - 10px)',
    marginRight: '15px',
    marginBottom: '20px',
    verticalAlign: 'top',
  };

  const lastCardStyle = {
    ...cardStyle,
    marginRight: 0,
  };

  return (
    <s-page heading="Dashboard">
      <div style={{ marginBottom: '30px' }}>
        <s-card style={cardStyle}>
          <s-box padding="loose">
            <s-stack direction="block" gap="base">
              <s-heading level="2">Animations</s-heading>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#006fbb' }}>
                {totalAnimations}
              </div>
              <s-text tone="subdued">Total Presets</s-text>
              <s-button
                onClick={() => window.location.href = '/app/animations'}
              >
                Manage
              </s-button>
            </s-stack>
          </s-box>
        </s-card>

        <s-card style={cardStyle}>
          <s-box padding="loose">
            <s-stack direction="block" gap="base">
              <s-heading level="2">Sounds</s-heading>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#006fbb' }}>
                {totalSounds}
              </div>
              <s-text tone="subdued">Total Presets</s-text>
              <s-button
                onClick={() => window.location.href = '/app/sounds'}
              >
                Manage
              </s-button>
            </s-stack>
          </s-box>
        </s-card>

        <s-card style={lastCardStyle}>
          <s-box padding="loose">
            <s-stack direction="block" gap="base">
              <s-heading level="2">Products</s-heading>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#006fbb' }}>
                {totalProducts}
              </div>
              <s-text tone="subdued">Configured</s-text>
              <s-button
                onClick={() => window.location.href = '/app/products'}
              >
                Configure
              </s-button>
            </s-stack>
          </s-box>
        </s-card>
      </div>

      <s-section heading="Getting Started">
        <s-box padding="loose" borderWidth="base" background="highlight">
          <s-stack direction="block" gap="base">
            <s-text variant="headingMd">Welcome to Fly To Cart Pro</s-text>
            <s-paragraph>
              Create engaging add-to-cart experiences with custom animations and sounds for your Shopify store.
            </s-paragraph>

            <s-stack direction="block" gap="tight">
              <div style={{ marginBottom: '12px' }}>
                <s-text variant="headingSm">Step 1: Create Animations</s-text>
                <s-text tone="subdued">
                  Go to Animations tab and create your first animation preset
                </s-text>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <s-text variant="headingSm">Step 2: Add Sounds</s-text>
                <s-text tone="subdued">
                  Go to Sounds tab and add sound effects
                </s-text>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <s-text variant="headingSm">Step 3: Configure Products</s-text>
                <s-text tone="subdued">
                  Assign animations and sounds to your products
                </s-text>
              </div>
              <div>
                <s-text variant="headingSm">Step 4: Customize Settings</s-text>
                <s-text tone="subdued">
                  Set global defaults in Settings
                </s-text>
              </div>
            </s-stack>
          </s-stack>
        </s-box>
      </s-section>

      <s-section heading="Quick Actions" slot="aside">
        <s-box padding="loose">
          <s-stack direction="block" gap="base">
            <s-button
              onClick={() => window.location.href = '/app/animations'}
            >
              Create Animation
            </s-button>
            <s-button
              onClick={() => window.location.href = '/app/sounds'}
            >
              Add Sound
            </s-button>
            <s-button
              onClick={() => window.location.href = '/app/products'}
            >
              Configure Product
            </s-button>
            <s-button
              onClick={() => window.location.href = '/app/settings'}
              variant="secondary"
            >
              Settings
            </s-button>
          </s-stack>
        </s-box>
      </s-section>
    </s-page>
  );
}
