import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { redirect } from "react-router";

export const PLAN_PRO = "pro" as const;

const IS_TEST = process.env.NODE_ENV !== "production";

export async function getCurrentPlan(request: Request) {
  const { session, billing } = await authenticate.admin(request);

  if (!session?.shop) throw new Error("No shop session found");

  let activePlan = {
    planName: null as string | null,
    status: null as string | null,
    trialEndsAt: null as Date | null,
    billingOn: null as Date | null,
    billingUnavailable: false,
  };

  try {
    // @ts-ignore billing plan type not inferred across module boundary
    const response = await billing.check({ plan: PLAN_PRO, isTest: IS_TEST });
    const subscription = response?.appSubscriptions?.[0];

    if (subscription?.status === "ACTIVE" || subscription?.status === "PENDING") {
      let trialEndsAt: Date | null = null;
      if (subscription.createdAt && subscription.trialDays) {
        const created = new Date(subscription.createdAt);
        trialEndsAt = new Date(created.getTime() + subscription.trialDays * 24 * 60 * 60 * 1000);
      }

      activePlan = {
        planName: PLAN_PRO,
        status: subscription.status.toLowerCase(),
        trialEndsAt,
        billingOn: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null,
        billingUnavailable: false,
      };
    }
  } catch (err: any) {
    const msg: string = err?.message || JSON.stringify(err?.errorData || "");
    if (msg.includes("public distribution")) {
      // App not yet set to public in Partner Dashboard — billing unavailable
      activePlan.billingUnavailable = true;
    }
    // All other errors (plan not yet subscribed) — activePlan stays null
  }

  // Sync to DB so other routes can read it fast
  await prisma.subscription.upsert({
    where: { shop: session.shop },
    create: {
      shop: session.shop,
      planName: activePlan.planName || "free",
      status: activePlan.status || "inactive",
      trialEndsAt: activePlan.trialEndsAt,
      billingOn: activePlan.billingOn,
    },
    update: {
      planName: activePlan.planName || "free",
      status: activePlan.status || "inactive",
      trialEndsAt: activePlan.trialEndsAt,
      billingOn: activePlan.billingOn,
    },
  });

  return activePlan;
}

export async function requestPlan(request: Request) {
  const { session, billing } = await authenticate.admin(request);

  if (!session?.shop) throw new Error("No shop session found");

  const shopName = session.shop.replace(".myshopify.com", "");
  const returnUrl = `https://admin.shopify.com/store/${shopName}/apps/fly-to-cart-pro/app/billing`;

  try {
    // billing.request() throws a redirect on success — do NOT catch that
    // @ts-ignore billing plan type not inferred across module boundary
    return await billing.request({ plan: PLAN_PRO, isTest: IS_TEST, returnUrl });
  } catch (err: any) {
    const msg: string = err?.message || JSON.stringify(err?.errorData || "");
    if (err instanceof Response) throw err; // let the redirect through
    if (msg.includes("public distribution")) {
      throw new Error("BILLING_UNAVAILABLE");
    }
    throw err;
  }
}

export async function cancelPlan(request: Request) {
  const { session } = await authenticate.admin(request);

  if (!session?.shop) throw new Error("No shop session found");

  await prisma.subscription.update({
    where: { shop: session.shop },
    data: { status: "cancelled", planName: "free" },
  });
}

export async function requireActiveSubscription(shop: string) {
  try {
    const subscription = await prisma.subscription.findUnique({ where: { shop } });

    if (!subscription || (subscription.status !== "active" && subscription.status !== "pending")) {
      throw redirect("/app/billing");
    }

    return subscription;
  } catch (err) {
    if (err instanceof Response) throw err;
    throw redirect("/app/billing");
  }
}
