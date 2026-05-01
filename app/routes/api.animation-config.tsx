import type { ActionFunctionArgs } from 'react-router';
import { authenticate } from '../shopify.server';
import { fetchProductWithAnimation } from '../utils/shopify-graphql';

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { admin } = await authenticate.admin(request);
    const body = (await request.json()) as any;
    const { productId } = body;

    if (!productId) {
      return new Response(JSON.stringify({ error: 'Product ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const product = await fetchProductWithAnimation(admin, productId);

    if (!product?.metafield) {
      return new Response(JSON.stringify({ animationKey: null, soundKey: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const config = JSON.parse(product.metafield.value);

    return new Response(
      JSON.stringify({
        animationKey: config.animation_preset_id,
        soundKey: config.sound_preset_id,
        duration: config.custom_duration_ms || 1000,
        volume: config.custom_volume || 0.8,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Failed to fetch animation config:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch configuration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
