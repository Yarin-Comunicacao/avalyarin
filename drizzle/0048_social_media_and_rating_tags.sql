ALTER TABLE `rating_photos`
  ADD `mediaType` enum('image','video') DEFAULT 'image' NOT NULL,
  ADD `position` int DEFAULT 0 NOT NULL,
  ADD `durationSeconds` int,
  ADD `mimeType` varchar(100);
--> statement-breakpoint
ALTER TABLE `group_messages`
  MODIFY COLUMN `type` enum('text','audio','image','video','share_rating','share_establishment','share_profile','poll','event','reservation') DEFAULT 'text' NOT NULL,
  ADD `mediaUrl` text,
  ADD `mediaStorageKey` varchar(512),
  ADD `mediaMimeType` varchar(100),
  ADD `mediaDurationSeconds` int,
  ADD `mediaSizeBytes` int,
  ADD `mediaThumbnailUrl` text;
--> statement-breakpoint
ALTER TABLE `direct_messages`
  MODIFY COLUMN `type` enum('text','audio','image','video') DEFAULT 'text' NOT NULL,
  ADD `mediaUrl` text,
  ADD `mediaStorageKey` varchar(512),
  ADD `mediaMimeType` varchar(100),
  ADD `mediaDurationSeconds` int,
  ADD `mediaSizeBytes` int,
  ADD `mediaThumbnailUrl` text;
--> statement-breakpoint
CREATE TABLE `rating_tags` (
  `id` int AUTO_INCREMENT NOT NULL,
  `ratingId` int NOT NULL,
  `taggedUserId` int NOT NULL,
  `taggedById` int NOT NULL,
  `status` enum('pending','accepted','declined','hidden','removed') DEFAULT 'pending' NOT NULL,
  `visibleOnProfile` boolean DEFAULT false NOT NULL,
  `notifiedAt` timestamp,
  `respondedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `rating_tags_id` PRIMARY KEY(`id`),
  CONSTRAINT `ratingTagsRatingUserUnique` UNIQUE(`ratingId`,`taggedUserId`)
);
--> statement-breakpoint
CREATE INDEX `rating_tags_rating_idx` ON `rating_tags` (`ratingId`);
--> statement-breakpoint
CREATE INDEX `rating_tags_user_status_idx` ON `rating_tags` (`taggedUserId`,`status`);
