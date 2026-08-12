ALTER TABLE `group_messages` MODIFY COLUMN `type` enum('text','share_rating','share_establishment','share_profile','poll') NOT NULL DEFAULT 'text';--> statement-breakpoint
ALTER TABLE `poll_options` ADD `dateValue` varchar(10);--> statement-breakpoint
ALTER TABLE `poll_options` ADD `establishmentId` int;--> statement-breakpoint
ALTER TABLE `polls` ADD `pollType` enum('texto','data','estab','total') DEFAULT 'texto' NOT NULL;--> statement-breakpoint
ALTER TABLE `polls` ADD `customAddress` varchar(255);--> statement-breakpoint
ALTER TABLE `polls` ADD `customNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `polls` ADD `customComplement` varchar(255);--> statement-breakpoint
ALTER TABLE `polls` ADD `messageId` int;