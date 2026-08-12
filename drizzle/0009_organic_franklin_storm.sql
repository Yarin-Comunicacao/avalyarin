CREATE TABLE `establishment_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('event','promotion','brand','menu_daily') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(512),
	`linkUrl` text,
	`startsAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`viewCount` int NOT NULL DEFAULT 0,
	`tapCount` int NOT NULL DEFAULT 0,
	`status` enum('draft','active','expired','removed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `establishment_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_saved_establishments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_saved_establishments_id` PRIMARY KEY(`id`)
);
