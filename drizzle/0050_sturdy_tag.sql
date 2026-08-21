CREATE TABLE `bug_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16),
	`createdById` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('bug','broken_route','performance','content','account','other') NOT NULL DEFAULT 'bug',
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('open','triaged','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`routePath` varchar(512),
	`platform` varchar(32),
	`userAgent` varchar(512),
	`viewport` varchar(32),
	`online` boolean,
	`appVersion` varchar(64),
	`errorMessage` text,
	`contextJson` text,
	`assignedToId` int,
	`resolution` text,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bug_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `bug_reports_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `rating_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ratingId` int NOT NULL,
	`taggedUserId` int NOT NULL,
	`taggedById` int NOT NULL,
	`status` enum('pending','accepted','declined','hidden','removed') NOT NULL DEFAULT 'pending',
	`visibleOnProfile` boolean NOT NULL DEFAULT false,
	`notifiedAt` timestamp,
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rating_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `ratingTagsRatingUserUnique` UNIQUE(`ratingId`,`taggedUserId`)
);
--> statement-breakpoint
ALTER TABLE `group_messages` MODIFY COLUMN `type` enum('text','audio','image','video','share_rating','share_establishment','share_profile','poll','event','reservation') NOT NULL DEFAULT 'text';--> statement-breakpoint
ALTER TABLE `direct_messages` ADD `type` enum('text','audio','image','video') DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE `direct_messages` ADD `mediaUrl` text;--> statement-breakpoint
ALTER TABLE `direct_messages` ADD `mediaStorageKey` varchar(512);--> statement-breakpoint
ALTER TABLE `direct_messages` ADD `mediaMimeType` varchar(100);--> statement-breakpoint
ALTER TABLE `direct_messages` ADD `mediaDurationSeconds` int;--> statement-breakpoint
ALTER TABLE `direct_messages` ADD `mediaSizeBytes` int;--> statement-breakpoint
ALTER TABLE `direct_messages` ADD `mediaThumbnailUrl` text;--> statement-breakpoint
ALTER TABLE `establishments` ADD `googleMapsUrl` text;--> statement-breakpoint
ALTER TABLE `establishments` ADD `facebook` text;--> statement-breakpoint
ALTER TABLE `establishments` ADD `website` text;--> statement-breakpoint
ALTER TABLE `group_messages` ADD `mediaUrl` text;--> statement-breakpoint
ALTER TABLE `group_messages` ADD `mediaStorageKey` varchar(512);--> statement-breakpoint
ALTER TABLE `group_messages` ADD `mediaMimeType` varchar(100);--> statement-breakpoint
ALTER TABLE `group_messages` ADD `mediaDurationSeconds` int;--> statement-breakpoint
ALTER TABLE `group_messages` ADD `mediaSizeBytes` int;--> statement-breakpoint
ALTER TABLE `group_messages` ADD `mediaThumbnailUrl` text;--> statement-breakpoint
ALTER TABLE `rating_photos` ADD `mediaType` enum('image','video') DEFAULT 'image' NOT NULL;--> statement-breakpoint
ALTER TABLE `rating_photos` ADD `position` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `rating_photos` ADD `durationSeconds` int;--> statement-breakpoint
ALTER TABLE `rating_photos` ADD `mimeType` varchar(100);