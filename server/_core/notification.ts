// Notification helper - logs to console (replace with email/push service as needed)
import { TRPCError } from "@trpc/server";

export type NotificationPayload = {
  title: string;
  content: string;
};

/**
 * Sends a notification to the app owner.
 * Currently logs to console. Replace with email, Telegram, or push notification service.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  if (!payload.title?.trim() || !payload.content?.trim()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title and content are required.",
    });
  }

  console.log(`[Notification] To Owner: ${payload.title} — ${payload.content}`);
  return true;
}
