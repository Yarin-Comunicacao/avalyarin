CREATE TABLE `event_attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`attended` boolean NOT NULL DEFAULT true,
	`markedBy` int NOT NULL,
	`markedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `group_messages` MODIFY COLUMN `type` enum('text','share_rating','share_establishment','share_profile','poll','event','reservation') NOT NULL DEFAULT 'text';--> statement-breakpoint
ALTER TABLE `group_events` ADD `businessStatus` enum('pending','confirmed','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `group_events` ADD `businessNote` text;--> statement-breakpoint
ALTER TABLE `group_events` ADD `businessRejectionReason` varchar(500);--> statement-breakpoint
ALTER TABLE `group_events` ADD `promoCode` varchar(100);--> statement-breakpoint
ALTER TABLE `group_events` ADD `promoDescription` text;--> statement-breakpoint
ALTER TABLE `group_events` ADD `suggestedMenu` text;--> statement-breakpoint
ALTER TABLE `group_events` ADD `cancelReason` text;--> statement-breakpoint
ALTER TABLE `group_events` ADD `cancelledBy` enum('creator','business');--> statement-breakpoint
ALTER TABLE `group_events` ADD `originalDate` timestamp;--> statement-breakpoint
ALTER TABLE `group_events` ADD `rescheduledBy` enum('creator','business');--> statement-breakpoint
ALTER TABLE `group_events` ADD `attendanceMarked` boolean DEFAULT false NOT NULL;--> statement-breakpoint
