CREATE TABLE `event_location_options` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`establishmentId` int,
	`manualName` varchar(255),
	`manualAddress` varchar(512),
	`isWinner` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_location_options_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_location_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`optionId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_location_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `group_events` MODIFY COLUMN `establishmentId` int;--> statement-breakpoint
ALTER TABLE `group_events` ADD `locationMode` enum('defined','voting','decided') DEFAULT 'defined' NOT NULL;--> statement-breakpoint
ALTER TABLE `group_events` ADD `manualLocationName` varchar(255);--> statement-breakpoint
ALTER TABLE `group_events` ADD `manualLocationAddress` varchar(512);--> statement-breakpoint
ALTER TABLE `group_events` ADD `votingClosesAt` timestamp;