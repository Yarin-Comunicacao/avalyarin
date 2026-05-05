CREATE TABLE `user_rankings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`position` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_rankings_id` PRIMARY KEY(`id`)
);
