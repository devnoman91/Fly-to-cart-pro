import type { ActionFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { authenticate } from '../shopify.server';
import { boundary } from '@shopify/shopify-app-react-router/server';
import { createAnimationPreset } from '../utils/shopify-graphql';

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return null;
  }

  const { admin } = await authenticate.admin(request);

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const key = formData.get('key') as string;
    const duration = parseInt(formData.get('duration') as string);
    const previewJson = formData.get('previewJson') as string;

    await createAnimationPreset(admin, {
      name,
      key,
      duration,
      previewJson,
      enabled: true,
    });

    return redirect('/app/animations?created=true');
  } catch (error) {
    console.error('Failed to create animation:', error);
    return null;
  }
};

export default function CreateAnimationPage() {
  return (
    <s-page heading="Create Animation">
      <s-button slot="primary-action" onClick={() => window.history.back()}>
        Back
      </s-button>

      <s-section heading="Animation Details">
        <form method="POST" style={{ maxWidth: '500px' }}>
          <s-box padding="loose" borderWidth="base">
            <s-stack direction="block" gap="base">
              <div>
                <s-label htmlFor="name">Animation Name</s-label>
                <s-text-input
                  id="name"
                  name="name"
                  placeholder="e.g., Slide In"
                  required
                />
              </div>

              <div>
                <s-label htmlFor="key">Animation Key</s-label>
                <s-text-input
                  id="key"
                  name="key"
                  placeholder="e.g., slide_in"
                  required
                />
              </div>

              <div>
                <s-label htmlFor="duration">Duration (ms)</s-label>
                <s-text-input
                  id="duration"
                  name="duration"
                  type="number"
                  value="1000"
                />
              </div>

              <div>
                <s-label htmlFor="previewJson">GSAP Config (JSON)</s-label>
                <s-text-input
                  id="previewJson"
                  name="previewJson"
                  placeholder='{"x": 100, "y": -100}'
                />
              </div>

              <s-button type="submit" variant="primary">
                Create Animation
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
