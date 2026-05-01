import React, { useEffect, useState } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  DataTable,
  Badge,
  Spinner,
  EmptyState,
} from '@shopify/polaris';

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
    <Page
      title="Fly-to-Cart Pro"
      subtitle="Manage animations and sounds for your store"
      primaryAction={{
        content: 'Settings',
        onAction: () => {},
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {/* Animations Section */}
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingLg">
                    Animations
                  </Text>
                  <Button onClick={onAddAnimation} variant="primary">
                    Add Animation
                  </Button>
                </InlineStack>

                {isLoading ? (
                  <Spinner accessibilityLabel="Loading animations" />
                ) : animations.length > 0 ? (
                  <DataTable
                    columnContentTypes={['text', 'text', 'numeric', 'text']}
                    headings={['Name', 'Key', 'Duration (ms)', 'Status']}
                    rows={animations.map((animation) => [
                      animation.animation_name,
                      animation.animation_key,
                      animation.duration_ms,
                      animation.enabled === 'true' ? (
                        <Badge tone="success">Enabled</Badge>
                      ) : (
                        <Badge>Disabled</Badge>
                      ),
                    ])}
                  />
                ) : (
                  <EmptyState
                    heading="No animations yet"
                    action={{ content: 'Create animation', onAction: onAddAnimation }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Create your first animation to get started.</p>
                  </EmptyState>
                )}
              </BlockStack>
            </Card>

            {/* Sounds Section */}
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingLg">
                    Sounds
                  </Text>
                  <Button onClick={onAddSound} variant="primary">
                    Add Sound
                  </Button>
                </InlineStack>

                {isLoading ? (
                  <Spinner accessibilityLabel="Loading sounds" />
                ) : sounds.length > 0 ? (
                  <DataTable
                    columnContentTypes={['text', 'text', 'numeric', 'text']}
                    headings={['Name', 'Key', 'Duration (ms)', 'Status']}
                    rows={sounds.map((sound) => [
                      sound.sound_name,
                      sound.sound_key,
                      sound.duration_ms,
                      sound.enabled === 'true' ? (
                        <Badge tone="success">Enabled</Badge>
                      ) : (
                        <Badge>Disabled</Badge>
                      ),
                    ])}
                  />
                ) : (
                  <EmptyState
                    heading="No sounds yet"
                    action={{ content: 'Create sound', onAction: onAddSound }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Create your first sound to get started.</p>
                  </EmptyState>
                )}
              </BlockStack>
            </Card>

            {/* Stats Section */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingLg">
                  Quick Stats
                </Text>
                <InlineStack gap="400">
                  <div>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Total Animations
                    </Text>
                    <Text as="p" variant="headingLg">
                      {animations.length}
                    </Text>
                  </div>
                  <div>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Total Sounds
                    </Text>
                    <Text as="p" variant="headingLg">
                      {sounds.length}
                    </Text>
                  </div>
                </InlineStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
