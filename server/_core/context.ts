import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { checkAndExpireUserRole, checkAndExpireBusinessRole } from "../db-plans";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  /** The effective role for limit calculations (owner/admin viewing as another role) */
  effectiveRole: string | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);

    // Check if professional role should be expired (35 days without payment)
    if (user && (user.role === "critic" || user.role === "specialist")) {
      const wasExpired = await checkAndExpireUserRole(user.id, user.role);
      if (wasExpired) {
        user = { ...user, role: "user" };
      }
    }

    // Check if business plan should be downgraded (progressive: 20/15/5 days)
    // Role stays 'business' — only the subscription plan goes to free
    if (user && user.role === "business") {
      await checkAndExpireBusinessRole(user.id);
      // No role change — business remains business, just loses premium features
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Owner/admin can simulate another role's limits via x-viewing-as header
  let effectiveRole: string | null = null;
  if (user && (user.role === "owner" || user.role === "admin")) {
    const viewingAs = opts.req.headers["x-viewing-as"] as string | undefined;
    if (viewingAs && viewingAs !== user.role) {
      effectiveRole = viewingAs;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    effectiveRole,
  };
}
