import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { redirect } from "react-router";

export const PLAN_PRO = "pro" as const;

const IS_TEST = process.env.NODE_ENV !== "production";
const APP_HANDLE = process.env.SHOPIFY_APP_HANDLE || "fly-to-cart-pro";
const APP_PRICING_HANDLES = new Set(
  (process.env.SHOPIFY_APP_PRICING_PLAN_HANDLES || `${PLAN_PRO},shopify-test`)
    .split(",")
    .map((handle) => normalizePlanHandle(handle))
    .filter(Boolean)
);

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

function normalizePlanHandle(handle: string | null | undefined) {
  return handle?.trim().toLowerCase().replace(/[\s_]+/g, "-") || "";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "errorData" in error) {
    return JSON.stringify(error.errorData);
  }
  return "";
}

function planFromAppPricingRedirect(request: Request, shop: string): CurrentPlan | null {
  const url = new URL(request.url);
  const redirectShop = url.searchParams.get("shop");
  const planHandle = url.searchParams.get("plan_handle");

  if (redirectShop && redirectShop !== shop) return null;
  if (!APP_PRICING_HANDLES.has(normalizePlanHandle(planHandle))) return null;

  return {
    planName: PLAN_PRO,
    status: "active",
    trialEndsAt: null,
    billingOn: null,
    billingUnavailable: false,
  };
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

  const appPricingRedirectPlan = planFromAppPricingRedirect(request, session.shop);
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

  // Shopify App Pricing redirects back with plan_handle. Use it immediately so
  // the UI reflects an approved Pro plan even before any reconciliation runs.
  if (!activePlan.status && appPricingRedirectPlan) {
    activePlan = appPricingRedirectPlan;
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
  const returnUrl = `https://admin.shopify.com/store/${shopName}/apps/fly-to-cart-pro/app/billing`;
  const appPricingUrl = `https://admin.shopify.com/store/${shopName}/charges/${APP_HANDLE}/pricing_plans`;

  try {
    // billing.request() throws a redirect on success — do NOT catch that
    return await billingApi.request({ plan: PLAN_PRO, isTest: IS_TEST, returnUrl });
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    if (err instanceof Response) throw err; // let the redirect through
    if (msg.includes("public distribution")) {
      throw new Error("BILLING_UNAVAILABLE");
    }
    if (msg.toLowerCase().includes("managed") || msg.toLowerCase().includes("app pricing")) {
      throw redirect(appPricingUrl);
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
