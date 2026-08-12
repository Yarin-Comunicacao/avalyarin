CREATE TABLE `promo_code_establishments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`promoCodeId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`status` enum('pending','accepted','on_hold') NOT NULL DEFAULT 'pending',
	`respondedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promo_code_establishments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `promo_codes` MODIFY COLUMN `creatorType` enum('specialist','business','critic') NOT NULL;