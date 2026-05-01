import React from 'react';

interface Animation {
  id: string;
  handle: string;
  animation_name: string;
  animation_key: string;
  duration_ms: string;
  enabled: string;
}

interface Sound {
  id: string;
  handle: string;
  sound_name: string;
  sound_key: string;
  duration_ms: string;
  enabled: string;
}

interface DashboardProps {
  animations: Animation[];
  sounds: Sound[];
  isLoading: boolean;
  onAddAnimation?: () => void;
  onAddSound?: () => void;
}

export function Dashboard({
  animations,
  sounds,
  isLoading,
  onAddAnimation,
  onAddSound,
}: DashboardProps) {
  return (
    <s-page heading="Fly-to-Cart Pro">
      <s-button slot="primary-action" onClick={onAddAnimation}>
        Add Animation
      </s-button>

      <s-section heading="Animations">
        {isLoading ? (
          <s-paragraph>Loading animations...</s-paragraph>
        ) : animations.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Key</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>
                    Duration (ms)
                  </th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {animations.map((animation) => (
                  <tr
                    key={animation.id}
                    style={{ borderBottom: '1px solid #e0e0e0' }}
                  >
                    <td style={{ padding: '10px' }}>
                      {animation.animation_name}
                    </td>
                    <td style={{ padding: '10px' }}>
                      {animation.animation_key}
                    </td>
                    <td style={{ padding: '10px' }}>
                      {animation.duration_ms}
                    </td>
                    <td style={{ padding: '10px' }}>
                      {animation.enabled === 'true' ? (
                        <s-badge tone="success">Enabled</s-badge>
                      ) : (
                        <s-badge>Disabled</s-badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <s-paragraph>No animations yet. Create your first animation.</s-paragraph>
        )}
      </s-section>

      <s-section heading="Sounds">
        {isLoading ? (
          <s-paragraph>Loading sounds...</s-paragraph>
        ) : sounds.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Key</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>
                    Duration (ms)
                  </th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sounds.map((sound) => (
                  <tr
                    key={sound.id}
                    style={{ borderBottom: '1px solid #e0e0e0' }}
                  >
                    <td style={{ padding: '10px' }}>{sound.sound_name}</td>
                    <td style={{ padding: '10px' }}>{sound.sound_key}</td>
                    <td style={{ padding: '10px' }}>{sound.duration_ms}</td>
                    <td style={{ padding: '10px' }}>
                      {sound.enabled === 'true' ? (
                        <s-badge tone="success">Enabled</s-badge>
                      ) : (
                        <s-badge>Disabled</s-badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <s-paragraph>No sounds yet. Create your first sound.</s-paragraph>
        )}
      </s-section>

      <s-section heading="Quick Stats" slot="aside">
        <s-box padding="base" borderWidth="base">
          <s-stack direction="block" gap="base">
            <div>
              <s-text>Total Animations</s-text>
              <s-heading level="1">{animations.length}</s-heading>
            </div>
            <div>
              <s-text>Total Sounds</s-text>
              <s-heading level="1">{sounds.length}</s-heading>
            </div>
          </s-stack>
        </s-box>
      </s-section>
    </s-page>
  );
}
