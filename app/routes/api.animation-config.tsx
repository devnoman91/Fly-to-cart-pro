import { json } from '@react-router/node';
import type { ActionFunctionArgs } from 'react-router';
import { authenticate } from '../shopify.server';
import { fetchProductWithAnimation } from '../utils/shopify-graphql';

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { admin } = await authenticate.admin(request);
    const body = (await request.json()) as any;
    const { productId } = body;

    if (!productId) {
      return json({ error: 'Product ID required' }, { status: 400 });
    }

    const product = await fetchProductWithAnimation(admin, productId);

    if (!product?.metafield) {
      return json({ animationKey: null, soundKey: null });
    }

    const config = JSON.parse(product.metafield.value);

    return json({
      animationKey: config.animation_preset_id,
      soundKey: config.sound_preset_id,
      duration: config.custom_duration_ms || 1000,
      volume: config.custom_volume || 0.8,
    });
  } catch (error) {
    console.error('Failed to fetch animation config:', error);
    return json({ error: 'Failed to fetch configuration' }, { status: 500 });
  }
};
