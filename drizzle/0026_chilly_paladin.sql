ALTER TABLE `groups` MODIFY COLUMN `type` enum('private','specialist','broadcast') NOT NULL;--> statement-breakpoint
ALTER TABLE `group_members` ADD `hidden` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `group_members` ADD `leftAt` timestamp;--> statement-breakpoint
ALTER TABLE `groups` ADD `linkedEntityId` int;--> statement-breakpoint
ALTER TABLE `groups` ADD `linkedEntityType` enum('establishment','specialist','critic');--> statement-breakpoint
ALTER TABLE `groups` ADD `isFixed` boolean DEFAULT false NOT NULL;