ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','owner','business','influencer') NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE TABLE `influencer_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`selectedRatingIds` json NOT NULL,
	`totalRatings` int NOT NULL,
	`qualifiedRatings` int NOT NULL,
	`motivation` text,
	`socialMedia` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`reviewedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `influencer_applications_id` PRIMARY KEY(`id`)
);--> statement-breakpoint
CREATE TABLE `partnerships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`influencerId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`promoCodeId` int,
	`proposedBy` enum('influencer','establishment') NOT NULL,
	`status` enum('pending_estab','pending_admin','active','rejected_estab','rejected_admin','cancelled','expired') NOT NULL DEFAULT 'pending_estab',
	`terms` text,
	`estabNotes` text,
	`adminNotes` text,
	`startsAt` bigint,
	`expiresAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partnerships_id` PRIMARY KEY(`id`)
);
