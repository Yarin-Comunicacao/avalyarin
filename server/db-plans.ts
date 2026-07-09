import { getDb } from "./db";
import {
  userPlans,
  subscriptions,
  businessSubscriptions,
  ratings,
  users,
} from "../drizzle/schema";
import { eq, and, gte, desc, sql, lte, inArray } from "drizzle-orm";

// ─── Plan Constants ──────────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  free: {
    dailyRatings: 10,
    maxGroups: null, // unlimited - sem limite de grupos
    maxPromoCodes: 1,
    canCreateSpecialistGroup: false,
    hasDouble: false,
    hasPartnerDiscounts: false,
    hasHighlight: false,
    hasPrioritySupport: false,
    hasExclusiveEvents: false,
    price: 0,
  },
  premium: {
    dailyRatings: null, // unlimited - Conhecedor
    maxGroups: null, // unlimited
    maxPromoCodes: 5,
    canCreateSpecialistGroup: true,
    hasDouble: true, // "Double" na primeira visita em parceiros
    hasPartnerDiscounts: true,
    hasHighlight: false,
    hasPrioritySupport: false,
    hasExclusiveEvents: false,
    price: 9.9,
  },
  embaixador: {
    dailyRatings: null, // unlimited
    maxGroups: null, // unlimited
    maxPromoCodes: null, // unlimited
    canCreateSpecialistGroup: true,
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

// ─── Role Expiration (35 days without payment) ──────────────────────────────

/**
 * Expire professional roles (critic/specialist) for users whose plan
 * expired more than 35 days ago. Reverts them to 'user' role.
 * Called by the Heartbeat cron daily.
 */
export async function expireOverdueRoles(): Promise<{ expired: number; userIds: number[] }> {
  const db = await getDb();
  if (!db) return { expired: 0, userIds: [] };

  const GRACE_PERIOD_DAYS = 35;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - GRACE_PERIOD_DAYS);

  // Find users who are critic/specialist AND whose plan expired before cutoff
  const expiredProfessionals = await db
    .select({ userId: userPlans.userId })
    .from(userPlans)
    .innerJoin(users, eq(users.id, userPlans.userId))
    .where(
      and(
        inArray(users.role, ["critic", "specialist"]),
        lte(userPlans.expiresAt, cutoffDate)
      )
    );

  if (expiredProfessionals.length === 0) {
    return { expired: 0, userIds: [] };
  }

  const userIds = expiredProfessionals.map((r) => r.userId);

  // Revert role to 'user'
  await db
    .update(users)
    .set({ role: "user" })
    .where(inArray(users.id, userIds));

  // Also downgrade their plan to free
  for (const uid of userIds) {
    await db
      .update(userPlans)
      .set({ plan: "free", expiresAt: null })
      .where(eq(userPlans.userId, uid));
  }

  return { expired: userIds.length, userIds };
}

/**
 * Check a single user's role expiration on login.
 * If their plan expired 35+ days ago and they're critic/specialist, revert to user.
 * Returns true if role was expired.
 */
export async function checkAndExpireUserRole(userId: number, currentRole: string): Promise<boolean> {
  if (currentRole !== "critic" && currentRole !== "specialist") return false;

  const db = await getDb();
  if (!db) return false;

  const GRACE_PERIOD_DAYS = 35;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - GRACE_PERIOD_DAYS);

  const [planRecord] = await db
    .select()
    .from(userPlans)
    .where(eq(userPlans.userId, userId))
    .limit(1);

  // If no plan record or plan is free, check if they should still be critic/specialist
  if (!planRecord || planRecord.plan === "free") {
    // No paid plan — check if expiresAt exists and is past cutoff
    if (!planRecord || !planRecord.expiresAt) {
      // No expiration set — they might have been granted the role without a plan
      // Don't expire in this case (admin-granted roles without plan)
      return false;
    }
    if (new Date(planRecord.expiresAt) < cutoffDate) {
      // Expired more than 35 days ago — revert
      await db.update(users).set({ role: "user" }).where(eq(users.id, userId));
      return true;
    }
  } else {
    // Has a paid plan — check if it's expired past grace period
    if (planRecord.expiresAt && new Date(planRecord.expiresAt) < cutoffDate) {
      await db.update(users).set({ role: "user" }).where(eq(users.id, userId));
      await db.update(userPlans).set({ plan: "free", expiresAt: null }).where(eq(userPlans.userId, userId));
      return true;
    }
  }

  return false;
}

// ─── Business Role Expiration (Progressive Grace Period) ────────────────────

/**
 * Calculate grace period based on missed payments history:
 * - 1st time: 20 days
 * - 2nd time: 15 days
 * - 3rd+ time: 5 days
 */
function getBusinessGracePeriod(missedPayments: number): number {
  if (missedPayments <= 0) return 20; // 1st time (will become 1 after increment)
  if (missedPayments === 1) return 15; // 2nd time
  return 5; // 3rd+ time
}

/**
 * Expire business roles for users whose business subscription expired
 * past their progressive grace period. Reverts them to 'user' role.
 * Increments missedPayments counter for history tracking.
 * Called by the Heartbeat cron daily.
 */
export async function expireOverdueBusinessPlans(): Promise<{
  expired: number;
  details: Array<{ userId: number; establishmentId: number; missedPayments: number; graceDays: number }>;
}> {
  const db = await getDb();
  if (!db) return { expired: 0, details: [] };

  const now = new Date();

  // Find all business subscriptions that are premium and have an expiresAt in the past
  const expiredSubs = await db
    .select()
    .from(businessSubscriptions)
    .innerJoin(users, eq(users.id, businessSubscriptions.userId))
    .where(
      and(
        eq(users.role, "business"),
        eq(businessSubscriptions.plan, "premium"),
        lte(businessSubscriptions.expiresAt, now)
      )
    );

  const details: Array<{ userId: number; establishmentId: number; missedPayments: number; graceDays: number }> = [];

  for (const row of expiredSubs) {
    const sub = row.business_subscriptions;
    const user = row.users;
    const currentMissed = sub.missedPayments;
    const graceDays = getBusinessGracePeriod(currentMissed);

    // Check if expired past grace period
    const graceDeadline = new Date(sub.expiresAt!);
    graceDeadline.setDate(graceDeadline.getDate() + graceDays);

    if (now >= graceDeadline) {
      // Grace period exceeded — expire the business role
      const newMissedCount = currentMissed + 1;

      // Increment missedPayments and set plan to free
      await db
        .update(businessSubscriptions)
        .set({
          plan: "free",
          status: "expired",
          missedPayments: newMissedCount,
        })
        .where(eq(businessSubscriptions.id, sub.id));

      // Revert user role to 'user'
      await db
        .update(users)
        .set({ role: "user" })
        .where(eq(users.id, user.id));

      details.push({
        userId: user.id,
        establishmentId: sub.establishmentId,
        missedPayments: newMissedCount,
        graceDays,
      });
    }
  }

  return { expired: details.length, details };
}

/**
 * Check a single business user's role expiration on login.
 * Uses progressive grace period based on missedPayments history.
 * Returns true if role was expired.
 */
export async function checkAndExpireBusinessRole(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const now = new Date();

  // Find their business subscription
  const [sub] = await db
    .select()
    .from(businessSubscriptions)
    .where(
      and(
        eq(businessSubscriptions.userId, userId),
        eq(businessSubscriptions.plan, "premium")
      )
    )
    .limit(1);

  if (!sub || !sub.expiresAt) return false;

  // Check if subscription is expired
  if (new Date(sub.expiresAt) >= now) return false; // Still valid

  // Subscription expired — check grace period
  const graceDays = getBusinessGracePeriod(sub.missedPayments);
  const graceDeadline = new Date(sub.expiresAt);
  graceDeadline.setDate(graceDeadline.getDate() + graceDays);

  if (now < graceDeadline) return false; // Still within grace period

  // Grace period exceeded — expire
  const newMissedCount = sub.missedPayments + 1;

  await db
    .update(businessSubscriptions)
    .set({
      plan: "free",
      status: "expired",
      missedPayments: newMissedCount,
    })
    .where(eq(businessSubscriptions.id, sub.id));

  await db
    .update(users)
    .set({ role: "user" })
    .where(eq(users.id, userId));

  return true;
}
