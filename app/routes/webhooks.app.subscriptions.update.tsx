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
      app_subscription?: {
        name?: string;
        status?: string;
        trial_ends_on?: string;
        trialEndsAt?: string;
        billing_on?: string;
        billingOn?: string;
      };
      name?: string;
      status?: string;
      trial_ends_on?: string;
      trialEndsAt?: string;
      billing_on?: string;
      billingOn?: string;
    };
    const subscription = sub.app_subscription || sub;
    const planName = subscription.name || "pro";
    const status = (subscription.status || "active").toLowerCase();
    const trialEndsAt = subscription.trialEndsAt || subscription.trial_ends_on;
    const billingOn = subscription.billingOn || subscription.billing_on;

    await prisma.subscription.upsert({
      where: { shop },
      create: {
        shop,
        planName,
        status,
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
        billingOn: billingOn ? new Date(billingOn) : null,
      },
      update: {
        planName,
        status,
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
        billingOn: billingOn ? new Date(billingOn) : null,
      },
    });

    console.log(`[FlyToCart] Subscription synced for ${shop}: ${status}`);
  } catch (err: unknown) {
    console.error(
      `[FlyToCart] Subscription webhook error for ${shop}:`,
      err instanceof Error ? err.message : err
    );
    return new Response("Error processing webhook", { status: 500 });
  }

  return new Response();
};
