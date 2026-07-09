import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { checkAndExpireUserRole, checkAndExpireBusinessRole } from "../db-plans";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
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

    // Check if business role should be expired (progressive: 20/15/5 days)
    if (user && user.role === "business") {
      const wasExpired = await checkAndExpireBusinessRole(user.id);
      if (wasExpired) {
        user = { ...user, role: "user" };
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
