ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','owner','business','influencer','support') NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE TABLE `support_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supportUserId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`assignedBy` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `support_assignments_id` PRIMARY KEY(`id`)
);--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(12),
	`establishmentId` int NOT NULL,
	`supportUserId` int,
	`createdById` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`resolution` text,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `support_tickets_code_unique` UNIQUE(`code`)
);
