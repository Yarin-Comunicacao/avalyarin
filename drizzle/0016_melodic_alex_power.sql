ALTER TABLE `specialist_applications` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `specialist_follows` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `groups` MODIFY COLUMN `type` enum('private','specialist') NOT NULL;--> statement-breakpoint
ALTER TABLE `partnerships` MODIFY COLUMN `partnershipType` enum('specialist','business') NOT NULL DEFAULT 'specialist';--> statement-breakpoint
ALTER TABLE `partnerships` MODIFY COLUMN `proposedBy` enum('specialist','establishment') NOT NULL;--> statement-breakpoint
ALTER TABLE `promo_codes` MODIFY COLUMN `creatorType` enum('specialist','business') NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','owner','business','specialist','critic','support') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `specialist_applications` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `specialist_follows` ADD PRIMARY KEY(`id`);