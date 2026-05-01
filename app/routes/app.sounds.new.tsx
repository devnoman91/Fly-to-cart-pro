import type { ActionFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { authenticate } from '../shopify.server';
import { boundary } from '@shopify/shopify-app-react-router/server';
import { createSoundPreset } from '../utils/shopify-graphql';

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return null;
  }

  const { admin } = await authenticate.admin(request);

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const key = formData.get('key') as string;
    const fileUrl = formData.get('fileUrl') as string;
    const duration = parseInt(formData.get('duration') as string);
    const volume = parseFloat(formData.get('volume') as string);

    await createSoundPreset(admin, {
      name,
      key,
      fileUrl,
      duration,
      volume,
      enabled: true,
    });

    return redirect('/app/sounds?created=true');
  } catch (error) {
    console.error('Failed to create sound:', error);
    return null;
  }
};

export default function CreateSoundPage() {
  return (
    <s-page heading="Create Sound">
      <s-button slot="primary-action" onClick={() => window.history.back()}>
        Back
      </s-button>

      <s-section heading="Sound Details">
        <form method="POST" style={{ maxWidth: '500px' }}>
          <s-box padding="loose" borderWidth="base">
            <s-stack direction="block" gap="base">
              <div>
                <s-label htmlFor="name">Sound Name</s-label>
                <s-text-input
                  id="name"
                  name="name"
                  placeholder="e.g., Chime"
                  required
                />
              </div>

              <div>
                <s-label htmlFor="key">Sound Key</s-label>
                <s-text-input
                  id="key"
                  name="key"
                  placeholder="e.g., chime"
                  required
                />
              </div>

              <div>
                <s-label htmlFor="fileUrl">Sound File URL</s-label>
                <s-text-input
                  id="fileUrl"
                  name="fileUrl"
                  type="url"
                  placeholder="/sounds/chime.mp3"
                  required
                />
              </div>

              <div>
                <s-label htmlFor="duration">Duration (ms)</s-label>
                <s-text-input
                  id="duration"
                  name="duration"
                  type="number"
                  value="500"
                />
              </div>

              <div>
                <s-label htmlFor="volume">Volume (0-1)</s-label>
                <s-text-input
                  id="volume"
                  name="volume"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value="0.8"
                />
              </div>

              <s-button type="submit" variant="primary">
                Create Sound
              </s-button>
            </s-stack>
          </s-box>
        </form>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs: any) => {
  return boundary.headers(headersArgs);
};
