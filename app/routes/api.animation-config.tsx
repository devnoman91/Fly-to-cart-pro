import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { fetchProductWithAnimation } from "../utils/shopify-graphql";

type AnimationConfigResponse =
  | {
      animationKey: string | null;
      soundKey: string | null;
      duration: number;
      volume: number;
      enabled: boolean;
    }
  | { error: string };

function json(data: AnimationConfigResponse, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function normalizeNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json(
      { error: "Method not allowed" },
      { status: 405, headers: { Allow: "POST" } },
    );
  }

  let productId: unknown;
  try {
    const body = (await request.json()) as { productId?: unknown };
    productId = body.productId;
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof productId !== "string" || productId.trim() === "") {
    return json({ error: "Product ID required" }, { status: 400 });
  }

  try {
    const { admin } = await authenticate.admin(request);
    const product = await fetchProductWithAnimation(admin, productId);

    if (!product?.metafield?.value) {
      return json({
        animationKey: null,
        soundKey: null,
        duration: 1000,
        volume: 0.8,
        enabled: false,
      });
    }

    const config = JSON.parse(product.metafield.value);

    return json({
      animationKey: config.animation_preset_id ?? config.animationKey ?? null,
      soundKey: config.sound_preset_id ?? config.soundKey ?? null,
      duration: normalizeNumber(config.custom_duration_ms ?? config.duration, 1000),
      volume: normalizeNumber(config.custom_volume ?? config.volume, 0.8),
      enabled: config.enabled !== false,
    });
  } catch (error) {
    console.error("Failed to fetch animation config:", error);
    return json({ error: "Failed to fetch configuration" }, { status: 500 });
  }
};
