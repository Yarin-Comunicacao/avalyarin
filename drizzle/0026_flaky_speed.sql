ALTER TABLE `subscriptions` MODIFY COLUMN `paymentMethod` enum('pix','credit_card','stripe','admin_grant') NOT NULL DEFAULT 'admin_grant';--> statement-breakpoint
ALTER TABLE `plans` ADD `stripePriceId` varchar(128);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `planId` int;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `stripeSubscriptionId` varchar(128);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `stripeSessionId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(128);