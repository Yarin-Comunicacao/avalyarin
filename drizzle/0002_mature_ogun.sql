CREATE TABLE `rating_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ratingId` int NOT NULL,
	`menuItemId` int,
	`itemName` varchar(255) NOT NULL,
	`score` float NOT NULL,
	`comment` text,
	`quantity` int DEFAULT 1,
	`price` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rating_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`type` enum('direct','analytic') NOT NULL,
	`visitDate` timestamp,
	`overallScore` float,
	`subtotal` float,
	`servicePercent` float,
	`couvert` float,
	`valet` float,
	`parking` float,
	`totalCost` float,
	`criteriaScores` json,
	`bonusScores` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ratings_id` PRIMARY KEY(`id`)
);
