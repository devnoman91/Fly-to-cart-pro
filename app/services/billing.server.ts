import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { redirect } from "react-router";

// Plan keys — these strings are the Shopify billing config keys (app/shopify.server.ts)
// AND the subscription `name` Shopify echoes back. Never rename PLAN_BASIC: existing
// subscribers match on "pro" (and keep their original price until they resubscribe).
export const PLAN_BASIC = "pro" as const;
export const PLAN_PREMIUM = "premium" as const;
/** @deprecated use PLAN_BASIC — kept so older imports don't break. */
export const PLAN_PRO = PLAN_BASIC;

const IS_TEST = false;
const TRIAL_DAYS = 14;

// Grandfather cutover. Subscriptions that existed before this moment were sold under
// the old "$3 = every feature" plan. An active legacy "pro" subscriber keeps full
// (Premium) access at their original price; only shops that subscribe to Basic AFTER
// this date get the new Basic limits. IMPORTANT: set this to your actual deploy date.
const GRANDFATHER_BEFORE = new Date("2026-08-11T00:00:00Z");

export type Tier = "basic" | "premium";

export interface Entitlements {
  tier: Tier;
  /** Full access — trial, an active premium sub, OR a grandfathered legacy subscriber. */
  isPremium: boolean;
  inTrial: boolean;
  /** True when this shop keeps Premium features via the pre-cutover grandfather rule. */
  grandfathered: boolean;
  status: string;
  planName: string;
  trialEndsAt: Date | null;
  billingOn: Date | null;
}

type EntitlementInput = {
  status: string;
  planName: string;
  trialEndsAt: Date | null;
  billingOn: Date | null;
  createdAt?: Date | null;
};

// Pure, no I/O — derive entitlements from a Subscription record so loaders/actions
// can gate features without a billing API round-trip.
export function resolveEntitlements(rec: EntitlementInput): Entitlements {
  const inTrial = !!rec.trialEndsAt && new Date() < new Date(rec.trialEndsAt);
  const paidActive = rec.status === "active" || rec.status === "pending";
  // Legacy customer: paying on the old Basic key ("pro") from before the cutover →
  // keep full access. This is the "old stays old" rule; new Basic subs don't match.
  const grandfathered =
    paidActive &&
    rec.planName === PLAN_BASIC &&
    !!rec.createdAt &&
    new Date(rec.createdAt) < GRANDFATHER_BEFORE;
  const isPremium =
    inTrial || (paidActive && rec.planName === PLAN_PREMIUM) || grandfathered;
  return {
    tier: isPremium ? "premium" : "basic",
    isPremium,
    inTrial,
    grandfathered,
    status: rec.status,
    planName: rec.planName,
    trialEndsAt: rec.trialEndsAt,
    billingOn: rec.billingOn,
  };
}

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

// ─── entitlement guards ───────────────────────────────────────────────────────
// requireEntitlements: loader guard — enforces the paywall (via requireActiveSubscription)
// then resolves the tier from the same DB record. No extra billing API call.
export async function requireEntitlements(shop: string, request?: Request): Promise<Entitlements> {
  const dbRecord = await requireActiveSubscription(shop, request);
  return resolveEntitlements(dbRecord);
}

// getEntitlements: action guard — resolves the tier WITHOUT redirecting, so a POST
// can return a clean error instead of throwing a redirect mid-submit.
export async function getEntitlements(shop: string): Promise<Entitlements> {
  const dbRecord = await getOrCreateTrialRecord(shop);
  return resolveEntitlements(dbRecord);
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
    // Check BOTH plans — the active sub's `name` tells us which tier the shop is on.
    const result = await (billing as any).check({ plans: [PLAN_BASIC, PLAN_PREMIUM], isTest: IS_TEST });
    const { hasActivePayment, appSubscriptions } = result ?? {};

    if (hasActivePayment && appSubscriptions?.[0]) {
      const sub = appSubscriptions[0];
      const billingOn = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
      // Record the REAL active plan (exact-match on the premium key; everything else = basic)
      const activeName = sub.name === PLAN_PREMIUM ? PLAN_PREMIUM : PLAN_BASIC;

      const updated = await prisma.subscription.update({
        where: { shop: session.shop },
        data: { status: "active", planName: activeName, billingOn },
      });

      return { ...resolveEntitlements(updated), billingUnavailable: false };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("public distribution")) {
      return { ...resolveEntitlements(dbRecord), billingUnavailable: true };
    }
  }

  // No active Shopify subscription — return DB record as-is (may be trial/expired)
  return { ...resolveEntitlements(dbRecord), billingUnavailable: false };
}

// ─── requestPlan ──────────────────────────────────────────────────────────────
// Initiates a Shopify billing subscription. billing.request() throws a redirect.

export async function requestPlan(request: Request, planKey: string = PLAN_BASIC) {
  const { session, billing } = await authenticate.admin(request);
  if (!session?.shop) throw new Error("No shop session");

  // Whitelist the incoming key — only our two plans are valid.
  const plan = planKey === PLAN_PREMIUM ? PLAN_PREMIUM : PLAN_BASIC;

  const shopName = session.shop.replace(".myshopify.com", "");
  const returnUrl = `https://admin.shopify.com/store/${shopName}/apps/fly-to-cart-pro/app/billing?subscribed=1`;

  try {
    // billing.request() supersedes any existing subscription on approval — no cancel-first.
    return await (billing as any).request({ plan, isTest: IS_TEST, returnUrl });
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
    const result = await (billing as any).check({ plans: [PLAN_BASIC, PLAN_PREMIUM], isTest: IS_TEST });
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

export async function requireActiveSubscription(shop: string, request?: Request) {
  const dbRecord = await getOrCreateTrialRecord(shop);

  // Paid and active → allow
  if (dbRecord.status === "active" || dbRecord.status === "pending") {
    return dbRecord;
  }

  // Within 14-day trial window → allow
  if (dbRecord.trialEndsAt && new Date() < new Date(dbRecord.trialEndsAt)) {
    return dbRecord;
  }

  // Trial expired, not subscribed → paywall.
  // Preserve the original request's query string (host, embedded, shop, etc.) —
  // a bare "/app/billing" redirect drops the embedded auth context and the
  // follow-up request fails authentication, landing on /auth/login instead.
  const search = request ? new URL(request.url).search : "";
  throw redirect(`/app/billing${search}`);
}
