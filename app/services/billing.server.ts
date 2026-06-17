import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { redirect } from "react-router";

export const PLAN_PRO = "pro" as const;

const IS_TEST = false;
const TRIAL_DAYS = 14;

function trialEndDate() {
  return new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

async function getOrCreateTrialRecord(shop: string) {
  return prisma.subscription.upsert({
    where: { shop },
    create: { shop, planName: "free", status: "trial", trialEndsAt: trialEndDate() },
    update: {}, // never overwrite on update — preserves createdAt and trialEndsAt
  });
}

// ─── getCurrentPlan ───────────────────────────────────────────────────────────
// Called from the billing page to get live subscription info.
// Uses the SDK's billing.check() with the correct `plans` array parameter.

export async function getCurrentPlan(request: Request) {
  const { session, billing } = await authenticate.admin(request);
  if (!session?.shop) throw new Error("No shop session");

  const dbRecord = await getOrCreateTrialRecord(session.shop);

  try {
    // billing.check() returns { hasActivePayment, appSubscriptions }
    // `plans` must be an array — using singular `plan` silently returns no match
    const result = await (billing as any).check({ plans: [PLAN_PRO], isTest: IS_TEST });
    const { hasActivePayment, appSubscriptions } = result ?? {};

    if (hasActivePayment && appSubscriptions?.[0]) {
      const sub = appSubscriptions[0];
      const billingOn = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;

      await prisma.subscription.update({
        where: { shop: session.shop },
        data: { status: "active", planName: PLAN_PRO, billingOn },
      });

      return {
        planName: PLAN_PRO as string,
        status: "active",
        trialEndsAt: dbRecord.trialEndsAt,
        billingOn,
        billingUnavailable: false,
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("public distribution")) {
      return {
        planName: dbRecord.planName,
        status: dbRecord.status,
        trialEndsAt: dbRecord.trialEndsAt,
        billingOn: dbRecord.billingOn,
        billingUnavailable: true,
      };
    }
  }

  // No active Shopify subscription — return DB record as-is (may be trial/expired)
  return {
    planName: dbRecord.planName,
    status: dbRecord.status,
    trialEndsAt: dbRecord.trialEndsAt,
    billingOn: dbRecord.billingOn,
    billingUnavailable: false,
  };
}

// ─── requestPlan ──────────────────────────────────────────────────────────────
// Initiates a Shopify billing subscription. billing.request() throws a redirect.

export async function requestPlan(request: Request) {
  const { session, billing } = await authenticate.admin(request);
  if (!session?.shop) throw new Error("No shop session");

  const shopName = session.shop.replace(".myshopify.com", "");
  const returnUrl = `https://admin.shopify.com/store/${shopName}/apps/fly-to-cart-pro/app/billing?subscribed=1`;

  try {
    return await (billing as any).request({ plan: PLAN_PRO, isTest: IS_TEST, returnUrl });
  } catch (err: unknown) {
    if (err instanceof Response) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("public distribution")) throw new Error("BILLING_UNAVAILABLE");
    throw err;
  }
}

// ─── cancelPlan ───────────────────────────────────────────────────────────────

export async function cancelPlan(request: Request) {
  const { session, billing } = await authenticate.admin(request);
  if (!session?.shop) throw new Error("No shop session");

  try {
    const result = await (billing as any).check({ plans: [PLAN_PRO], isTest: IS_TEST });
    const sub = result?.appSubscriptions?.[0];
    if (sub?.id) {
      await (billing as any).cancel({ subscriptionId: sub.id, isTest: IS_TEST, prorate: true });
    }
  } catch (err: unknown) {
    if (err instanceof Response) throw err;
  }

  await prisma.subscription.update({
    where: { shop: session.shop },
    data: { status: "cancelled", planName: "free" },
  });
}

// ─── requireActiveSubscription ───────────────────────────────────────────────
// Called in every protected route loader.
// Allows access during 14-day trial; redirects to billing after trial expires.

export async function requireActiveSubscription(shop: string) {
  const dbRecord = await getOrCreateTrialRecord(shop);

  // Paid and active → allow
  if (dbRecord.status === "active" || dbRecord.status === "pending") {
    return dbRecord;
  }

  // Within 14-day trial window → allow
  if (dbRecord.trialEndsAt && new Date() < new Date(dbRecord.trialEndsAt)) {
    return dbRecord;
  }

  // Trial expired, not subscribed → paywall
  throw redirect("/app/billing");
}
