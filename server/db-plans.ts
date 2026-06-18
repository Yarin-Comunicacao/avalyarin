import { getDb } from "./db";
import {
  userPlans,
  subscriptions,
  businessSubscriptions,
  ratings,
} from "../drizzle/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";

// ─── Plan Constants ──────────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  free: {
    dailyRatings: 3,
    maxGroups: null, // unlimited - sem limite de grupos
    maxPromoCodes: 1,
    canCreateInfluencerGroup: false,
    hasDouble: false,
    hasPartnerDiscounts: false,
    hasHighlight: false,
    hasPrioritySupport: false,
    hasExclusiveEvents: false,
    price: 0,
  },
  premium: {
    dailyRatings: 5,
    maxGroups: null, // unlimited
    maxPromoCodes: 5,
    canCreateInfluencerGroup: true,
    hasDouble: true, // "Double" na primeira visita
    hasPartnerDiscounts: false,
    hasHighlight: false,
    hasPrioritySupport: false,
    hasExclusiveEvents: false,
    price: 9.9,
  },
  embaixador: {
    dailyRatings: null, // unlimited
    maxGroups: null, // unlimited
    maxPromoCodes: null, // unlimited
    canCreateInfluencerGroup: true,
    hasDouble: true,
    hasPartnerDiscounts: true,
    hasHighlight: true,
    hasPrioritySupport: true,
    hasExclusiveEvents: true,
    price: 19.9,
  },
} as const;

export const BUSINESS_PLAN_LIMITS = {
  free: {
    maxPromoCodes: 1,
    hasAnalytics: false,
    hasHighlight: false,
    price: 0,
  },
  premium: {
    maxPromoCodes: null, // unlimited
    hasAnalytics: true,
    hasHighlight: true,
    price: 29.9,
  },
} as const;

export type UserPlanType = keyof typeof PLAN_LIMITS;
export type BusinessPlanType = keyof typeof BUSINESS_PLAN_LIMITS;

// ─── User Plan Queries ───────────────────────────────────────────────────────

/**
 * Get user's current plan (returns "free" if no record exists)
 */
export async function getUserPlanType(userId: number): Promise<UserPlanType> {
  const db = await getDb();
  if (!db) return "free";
  const [plan] = await db
    .select()
    .from(userPlans)
    .where(eq(userPlans.userId, userId))
    .limit(1);
  if (!plan) return "free";
  // Check if expired
  if (plan.expiresAt && new Date(plan.expiresAt) < new Date()) {
    return "free";
  }
  return plan.plan as UserPlanType;
}

/**
 * Get user's plan with full details
 */
export async function getUserPlanDetails(userId: number) {
  const db = await getDb();
  if (!db) return { plan: "free" as UserPlanType, limits: PLAN_LIMITS.free, subscription: null };
  const [planRecord] = await db
    .select()
    .from(userPlans)
    .where(eq(userPlans.userId, userId))
    .limit(1);
  let currentPlan: UserPlanType = "free";
  if (planRecord) {
    if (planRecord.expiresAt && new Date(planRecord.expiresAt) < new Date()) {
      currentPlan = "free";
    } else {
      currentPlan = planRecord.plan as UserPlanType;
    }
  }
  // Get active subscription
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )
    )
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return {
    plan: currentPlan,
    limits: PLAN_LIMITS[currentPlan],
    subscription: subscription || null,
  };
}

/**
 * Count user's ratings today
 */
export async function countUserRatingsToday(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(ratings)
    .where(
      and(
        eq(ratings.userId, userId),
        gte(ratings.createdAt, todayStart)
      )
    );
  return result?.count ?? 0;
}

/**
 * Check if user can create a new rating today
 */
export async function canUserRate(userId: number): Promise<{ allowed: boolean; remaining: number | null; plan: UserPlanType }> {
  const plan = await getUserPlanType(userId);
  const limit = PLAN_LIMITS[plan].dailyRatings;
  if (limit === null) {
    return { allowed: true, remaining: null, plan };
  }
  const todayCount = await countUserRatingsToday(userId);
  const remaining = Math.max(0, limit - todayCount);
  return { allowed: remaining > 0, remaining, plan };
}

// ─── Subscription Management ─────────────────────────────────────────────────

/**
 * Upgrade user plan (admin grant or payment confirmation)
 */
export async function upgradePlan(data: {
  userId: number;
  plan: "premium" | "embaixador";
  paymentMethod?: "pix" | "credit_card" | "admin_grant";
  durationMonths?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { userId, plan, paymentMethod = "admin_grant", durationMonths = 1 } = data;
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
  // Upsert user_plans
  const [existing] = await db
    .select()
    .from(userPlans)
    .where(eq(userPlans.userId, userId))
    .limit(1);
  if (existing) {
    await db
      .update(userPlans)
      .set({ plan, expiresAt })
      .where(eq(userPlans.userId, userId));
  } else {
    await db.insert(userPlans).values({
      userId,
      plan,
      expiresAt,
    });
  }
  // Create subscription record
  const price = PLAN_LIMITS[plan].price;
  await db.insert(subscriptions).values({
    userId,
    plan,
    status: "active",
    priceMonthly: price,
    paymentMethod,
    expiresAt,
  });
  return { success: true, plan, expiresAt };
}

/**
 * Cancel user subscription
 */
export async function cancelSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Mark subscription as cancelled
  await db
    .update(subscriptions)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )
    );
  // Note: plan stays active until expiresAt (user keeps benefits until end of billing period)
  return { success: true };
}

/**
 * Downgrade user to free (immediate)
 */
export async function downgradePlan(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(userPlans)
    .set({ plan: "free", expiresAt: null })
    .where(eq(userPlans.userId, userId));
  // Cancel active subscription
  await db
    .update(subscriptions)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )
    );
  return { success: true };
}

// ─── Business Plan Queries ───────────────────────────────────────────────────

/**
 * Get business plan for an establishment
 */
export async function getBusinessPlan(establishmentId: number): Promise<BusinessPlanType> {
  const db = await getDb();
  if (!db) return "free";
  const [plan] = await db
    .select()
    .from(businessSubscriptions)
    .where(
      and(
        eq(businessSubscriptions.establishmentId, establishmentId),
        eq(businessSubscriptions.status, "active")
      )
    )
    .limit(1);
  if (!plan) return "free";
  if (plan.expiresAt && new Date(plan.expiresAt) < new Date()) {
    return "free";
  }
  return plan.plan as BusinessPlanType;
}

/**
 * Get business plan details
 */
export async function getBusinessPlanDetails(establishmentId: number) {
  const db = await getDb();
  if (!db) return { plan: "free" as BusinessPlanType, limits: BUSINESS_PLAN_LIMITS.free, subscription: null };
  const [subscription] = await db
    .select()
    .from(businessSubscriptions)
    .where(
      and(
        eq(businessSubscriptions.establishmentId, establishmentId),
        eq(businessSubscriptions.status, "active")
      )
    )
    .orderBy(desc(businessSubscriptions.createdAt))
    .limit(1);
  let currentPlan: BusinessPlanType = "free";
  if (subscription) {
    if (subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) {
      currentPlan = "free";
    } else {
      currentPlan = subscription.plan as BusinessPlanType;
    }
  }
  return {
    plan: currentPlan,
    limits: BUSINESS_PLAN_LIMITS[currentPlan],
    subscription: subscription || null,
  };
}

/**
 * Upgrade business plan
 */
export async function upgradeBusinessPlan(data: {
  establishmentId: number;
  userId: number;
  durationMonths?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { establishmentId, userId, durationMonths = 1 } = data;
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
  // Check if existing subscription
  const [existing] = await db
    .select()
    .from(businessSubscriptions)
    .where(eq(businessSubscriptions.establishmentId, establishmentId))
    .limit(1);
  if (existing) {
    await db
      .update(businessSubscriptions)
      .set({ plan: "premium", status: "active", expiresAt })
      .where(eq(businessSubscriptions.id, existing.id));
  } else {
    await db.insert(businessSubscriptions).values({
      establishmentId,
      userId,
      plan: "premium",
      status: "active",
      priceMonthly: BUSINESS_PLAN_LIMITS.premium.price,
      expiresAt,
    });
  }
  return { success: true, plan: "premium", expiresAt };
}

// ─── Admin: Subscription Management ─────────────────────────────────────────

/**
 * Admin: list all subscriptions
 */
export async function getAdminSubscriptions(status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = status
    ? eq(subscriptions.status, status as "active" | "cancelled" | "expired" | "past_due")
    : undefined;
  return await db
    .select()
    .from(subscriptions)
    .where(conditions)
    .orderBy(desc(subscriptions.createdAt));
}

/**
 * Admin: grant a plan to a user
 */
export async function adminGrantPlan(userId: number, plan: "premium" | "embaixador", durationMonths: number) {
  return upgradePlan({
    userId,
    plan,
    paymentMethod: "admin_grant",
    durationMonths,
  });
}
