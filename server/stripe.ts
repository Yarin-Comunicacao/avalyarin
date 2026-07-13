import Stripe from "stripe";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { users, plans, subscriptions, userPlans, businessSubscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Initialize Stripe
const stripe = new Stripe(ENV.stripeSecretKey);

export { stripe };

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(userId: number): Promise<string> {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");

  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email || undefined,
    name: user.name || undefined,
    metadata: { userId: String(userId), openId: user.openId },
  });

  await db.update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, userId));
  return customer.id;
}

/**
 * Create a Stripe Checkout Session for a plan subscription
 */
export async function createCheckoutSession(params: {
  userId: number;
  planId: number;
  successUrl: string;
  cancelUrl: string;
  promoCode?: string;
}): Promise<{ sessionId: string; url: string }> {
  const db = await getDb();
  const { userId, planId, successUrl, cancelUrl, promoCode } = params;

  // Get the plan
  const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  if (!plan) throw new Error("Plan not found");
  if (!plan.stripePriceId) throw new Error("Plan has no Stripe Price ID configured");

  // Get or create customer
  const customerId = await getOrCreateStripeCustomer(userId);

  // Build session params
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: plan.price === 0 ? "setup" : "subscription",
    line_items: plan.price > 0 ? [{ price: plan.stripePriceId, quantity: 1 }] : undefined,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: String(userId),
      planId: String(planId),
    },
    subscription_data: plan.price > 0 ? {
      metadata: {
        userId: String(userId),
        planId: String(planId),
      },
    } : undefined,
  };

  // Apply promo code if provided
  if (promoCode && plan.price > 0) {
    try {
      const promotionCodes = await stripe.promotionCodes.list({
        code: promoCode,
        active: true,
        limit: 1,
      });
      if (promotionCodes.data.length > 0) {
        sessionParams.discounts = [{ promotion_code: promotionCodes.data[0].id }];
      } else {
        // Try as coupon directly
        sessionParams.discounts = [{ coupon: promoCode }];
      }
    } catch {
      // If promo code is invalid, proceed without it
    }
  }

  // For free plans, just activate directly
  if (plan.price === 0) {
    await activateSubscription(userId, planId, null);
    return { sessionId: "free", url: successUrl };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return { sessionId: session.id, url: session.url! };
}

/**
 * Create a Stripe Billing Portal session for managing subscriptions
 */
export async function createPortalSession(userId: number, returnUrl: string): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(userId);
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

/**
 * Activate a subscription in the database after successful payment
 */
export async function activateSubscription(
  userId: number,
  planId: number,
  stripeSubscriptionId: string | null,
  stripeSessionId?: string
): Promise<void> {
  const db = await getDb();
  const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  if (!plan) throw new Error("Plan not found");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");

  const roles = (typeof plan.roles === "string" ? JSON.parse(plan.roles as string) : plan.roles) as string[] || [];

  // Determine which plan type to activate based on roles
  if (roles.includes("business")) {
    // Business subscription
    await db.insert(businessSubscriptions).values({
      establishmentId: 0, // Will be linked later
      userId,
      plan: plan.price > 0 ? "premium" : "free",
      status: "active",
      priceMonthly: plan.price,
      startsAt: new Date(),
    } as any).onDuplicateKeyUpdate({
      set: {
        plan: plan.price > 0 ? "premium" : "free",
        status: "active",
        priceMonthly: plan.price,
      } as any,
    });
  } else {
    // User subscription - update userPlans
    const planEnum = plan.price >= 19.9 ? "embaixador" : plan.price >= 9.9 ? "premium" : "free";
    
    const [existing] = await db.select().from(userPlans).where(eq(userPlans.userId, userId)).limit(1);
    if (existing) {
      await db.update(userPlans).set({ plan: planEnum }).where(eq(userPlans.userId, userId));
    } else {
      await db.insert(userPlans).values({ userId, plan: planEnum });
    }
  }

  // Record in subscriptions table
  const planEnumSub = plan.price >= 19.9 ? "embaixador" : "premium";
  if (plan.price > 0) {
    await db.insert(subscriptions).values({
      userId,
      planId,
      plan: planEnumSub,
      status: "active",
      priceMonthly: plan.price,
      paymentMethod: stripeSubscriptionId ? "stripe" : "admin_grant",
      stripeSubscriptionId: stripeSubscriptionId || undefined,
      stripeSessionId: stripeSessionId || undefined,
      startsAt: new Date(),
    } as any);
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(userId: number): Promise<void> {
  const db = await getDb();
  // Find active Stripe subscription
  const [sub] = await db.select().from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (sub?.stripeSubscriptionId) {
    // Cancel on Stripe (at period end)
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  // Update local status
  await db.update(subscriptions)
    .set({ status: "cancelled", cancelledAt: new Date() } as any)
    .where(eq(subscriptions.userId, userId));
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  const db = await getDb();
  
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = parseInt(session.metadata?.userId || "0");
      const planId = parseInt(session.metadata?.planId || "0");
      
      if (userId && planId) {
        const subscriptionId = typeof session.subscription === "string" 
          ? session.subscription 
          : (session.subscription as any)?.id || null;
        await activateSubscription(userId, planId, subscriptionId, session.id);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = parseInt(subscription.metadata?.userId || "0");
      
      if (userId) {
        const status = subscription.status === "active" ? "active" 
          : subscription.status === "past_due" ? "past_due"
          : subscription.status === "canceled" ? "cancelled" 
          : "expired";
        
        await db.update(subscriptions)
          .set({ status } as any)
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
        
        // If cancelled, downgrade user plan
        if (status === "cancelled" || status === "expired") {
          await db.update(userPlans).set({ plan: "free" }).where(eq(userPlans.userId, userId));
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = parseInt(subscription.metadata?.userId || "0");
      
      if (userId) {
        await db.update(subscriptions)
          .set({ status: "cancelled", cancelledAt: new Date() } as any)
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
        
        // Downgrade user
        await db.update(userPlans).set({ plan: "free" }).where(eq(userPlans.userId, userId));
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      const subscriptionId = typeof invoice.subscription === "string" 
        ? invoice.subscription 
        : invoice.subscription?.id;
      
      if (subscriptionId) {
        await db.update(subscriptions)
          .set({ status: "past_due" } as any)
          .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
      }
      break;
    }
  }
}

/**
 * Verify and construct webhook event from raw body
 */
export function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(rawBody, signature, ENV.stripeWebhookSecret);
}
