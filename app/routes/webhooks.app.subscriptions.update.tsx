import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`[FlyToCart] ${topic} webhook for ${shop}`);

  if (!payload) {
    return new Response("No payload", { status: 400 });
  }

  try {
    const sub = payload as {
      name?: string;
      status?: string;
      trialEndsAt?: string;
      billingOn?: string;
    };

    await prisma.subscription.upsert({
      where: { shop },
      create: {
        shop,
        planName: sub.name || "pro",
        status: (sub.status || "active").toLowerCase(),
        trialEndsAt: sub.trialEndsAt ? new Date(sub.trialEndsAt) : null,
        billingOn: sub.billingOn ? new Date(sub.billingOn) : null,
      },
      update: {
        planName: sub.name || "pro",
        status: (sub.status || "active").toLowerCase(),
        trialEndsAt: sub.trialEndsAt ? new Date(sub.trialEndsAt) : null,
        billingOn: sub.billingOn ? new Date(sub.billingOn) : null,
      },
    });

    console.log(`[FlyToCart] Subscription synced for ${shop}: ${sub.status}`);
  } catch (err: any) {
    console.error(`[FlyToCart] Subscription webhook error for ${shop}:`, err?.message);
    return new Response("Error processing webhook", { status: 500 });
  }

  return new Response();
};
