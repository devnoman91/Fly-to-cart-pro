import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { redirect } from "react-router";

export const PLAN_PRO = "pro" as const;

const IS_TEST = false;

type CurrentPlan = {
  planName: string | null;
  status: string | null;
  trialEndsAt: Date | null;
  billingOn: Date | null;
  billingUnavailable: boolean;
};

type BillingSubscription = {
  id?: string;
  status?: string;
  createdAt?: string | Date;
  trialDays?: number;
  currentPeriodEnd?: string | Date;
};

type BillingApi = {
  check(options: { plan: typeof PLAN_PRO; isTest: boolean }): Promise<{
    appSubscriptions?: BillingSubscription[];
  }>;
  request(options: { plan: typeof PLAN_PRO; isTest: boolean; returnUrl: string }): Promise<Response>;
  cancel(options: { subscriptionId: string; isTest: boolean; prorate: boolean }): Promise<unknown>;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "errorData" in error) {
    return JSON.stringify(error.errorData);
  }
  return "";
}

async function persistPlan(shop: string, plan: CurrentPlan) {
  await prisma.subscription.upsert({
    where: { shop },
    create: {
      shop,
      planName: plan.planName || "free",
      status: plan.status || "inactive",
      trialEndsAt: plan.trialEndsAt,
      billingOn: plan.billingOn,
    },
    update: {
      planName: plan.planName || "free",
      status: plan.status || "inactive",
      trialEndsAt: plan.trialEndsAt,
      billingOn: plan.billingOn,
    },
  });
}

export async function getCurrentPlan(request: Request) {
  const { session, billing } = await authenticate.admin(request);
  const billingApi = billing as unknown as BillingApi;

  if (!session?.shop) throw new Error("No shop session found");

  const cachedPlan = await prisma.subscription.findUnique({ where: { shop: session.shop } });

  let activePlan: CurrentPlan = {
    planName: null,
    status: null,
    trialEndsAt: null,
    billingOn: null,
    billingUnavailable: false,
  };

  try {
    const response = await billingApi.check({ plan: PLAN_PRO, isTest: IS_TEST });
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
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    if (msg.includes("public distribution")) {
      // App not yet set to public in Partner Dashboard — billing unavailable
      activePlan.billingUnavailable = true;
    }
    // All other errors (plan not yet subscribed) — activePlan stays null
  }

  if (
    !activePlan.status &&
    !activePlan.billingUnavailable &&
    cachedPlan?.status &&
    ["active", "pending"].includes(cachedPlan.status) &&
    !cachedPlan.billingOn
  ) {
    activePlan = {
      planName: cachedPlan.planName,
      status: cachedPlan.status,
      trialEndsAt: cachedPlan.trialEndsAt,
      billingOn: cachedPlan.billingOn,
      billingUnavailable: false,
    };
  }

  // Sync to DB so other routes can read it fast.
  await persistPlan(session.shop, activePlan);

  return activePlan;
}

export async function requestPlan(request: Request) {
  const { session, billing } = await authenticate.admin(request);
  const billingApi = billing as unknown as BillingApi;

  if (!session?.shop) throw new Error("No shop session found");

  const shopName = session.shop.replace(".myshopify.com", "");
  const returnUrl = `https://admin.shopify.com/store/${shopName}/apps/fly-to-cart-pro/app/billing?subscribed=1`;

  try {
    // billing.request() throws a redirect on success — do NOT catch that
    return await billingApi.request({ plan: PLAN_PRO, isTest: IS_TEST, returnUrl });
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    if (err instanceof Response) throw err; // let the redirect through
    if (msg.includes("public distribution")) {
      throw new Error("BILLING_UNAVAILABLE");
    }
    throw err;
  }
}

export async function cancelPlan(request: Request) {
  const { session, billing } = await authenticate.admin(request);
  const billingApi = billing as unknown as BillingApi;

  if (!session?.shop) throw new Error("No shop session found");

  // Cancel with Shopify first so the merchant is prorated correctly
  try {
    const response = await billingApi.check({ plan: PLAN_PRO, isTest: IS_TEST });
    const subscription = response?.appSubscriptions?.[0];
    if (subscription?.id) {
      await billingApi.cancel({ subscriptionId: subscription.id, isTest: IS_TEST, prorate: true });
    }
  } catch (err: unknown) {
    if (err instanceof Response) throw err;
    // If no active subscription exists there is nothing to cancel via API
  }

  await prisma.subscription.update({
    where: { shop: session.shop },
    data: { status: "cancelled", planName: "free" },
  });
}

export async function requireActiveSubscription(shop: string) {
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  // Create a trial record on first visit; preserve existing data on subsequent calls
  const subscription = await prisma.subscription.upsert({
    where: { shop },
    create: { shop, planName: "free", status: "trial", trialEndsAt: trialEnd },
    update: {},
  });

  // Paid subscription active → allow
  if (subscription.status === "active" || subscription.status === "pending") {
    return subscription;
  }

  // Within 14-day trial window → allow
  if (subscription.trialEndsAt && new Date() < new Date(subscription.trialEndsAt)) {
    return subscription;
  }

  // Trial expired, no subscription → paywall
  throw redirect("/app/billing");
}
