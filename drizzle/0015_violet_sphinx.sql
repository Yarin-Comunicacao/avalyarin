CREATE TABLE `business_broadcasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessUserId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`content` varchar(280) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_broadcasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_followers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_followers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`title` varchar(256) NOT NULL,
	`message` text,
	`ratingId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`userId` int NOT NULL,
	`plan` enum('free','premium') NOT NULL DEFAULT 'free',
	`status` enum('active','cancelled','expired') NOT NULL DEFAULT 'active',
	`priceMonthly` float,
	`startsAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `critic_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(255),
	`bio` text,
	`publication` varchar(255),
	`publicationUrl` varchar(512),
	`specialty` varchar(255),
	`verified` boolean NOT NULL DEFAULT false,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `critic_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `critic_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `direct_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`content` varchar(500) NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `direct_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `duplicate_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`existingEstablishmentId` int NOT NULL,
	`newEstablishmentId` int NOT NULL,
	`reason` varchar(50) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`flaggedBy` int NOT NULL,
	`reviewedBy` int,
	`notes` varchar(500),
	`reviewNotes` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `duplicate_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `establishment_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`badgeType` enum('vegetariano','vegano','sem_gluten') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `establishment_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `establishment_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`categoryId` int NOT NULL,
	`isPrimary` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `establishment_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `establishment_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`createdById` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`coverImageUrl` text NOT NULL,
	`coverImageKey` varchar(512),
	`startDate` bigint NOT NULL,
	`endDate` bigint NOT NULL,
	`locationType` enum('establishment','custom') NOT NULL DEFAULT 'establishment',
	`customAddress` text,
	`customAddressNumber` varchar(20),
	`customNeighborhood` varchar(128),
	`customCity` varchar(128),
	`entryType` enum('free','paid') NOT NULL,
	`paidType` enum('single','batches') DEFAULT 'single',
	`singlePrice` float,
	`hasDoorPrice` boolean DEFAULT false,
	`doorPrice` float,
	`eventType` enum('esporte','show','festa','gastronomia','cultural','stand_up','quiz','degustacao','workshop','karaoke','dj','sertanejo','pagode','forro','samba','outro') NOT NULL,
	`ticketUrl` varchar(500),
	`status` enum('active','cancelled','completed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `establishment_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`batchNumber` int NOT NULL,
	`batchName` varchar(64) NOT NULL,
	`price` float NOT NULL,
	`expiresAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_rsvps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('confirmed','maybe','declined') NOT NULL DEFAULT 'confirmed',
	`respondedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_rsvps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `group_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(12),
	`groupId` int NOT NULL,
	`creatorId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`eventDate` timestamp NOT NULL,
	`maxGuests` int,
	`status` enum('active','cancelled','completed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `group_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `group_events_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `group_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` varchar(140) NOT NULL,
	`type` enum('text','share_rating','share_establishment','share_profile') NOT NULL DEFAULT 'text',
	`referenceId` int,
	`referenceSlug` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `group_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `influencer_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`selectedRatingIds` json NOT NULL,
	`totalRatings` int NOT NULL,
	`qualifiedRatings` int NOT NULL,
	`motivation` text,
	`socialMedia` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`reviewedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `influencer_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `influencer_follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`influencerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `influencer_follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(128) NOT NULL,
	`value` text,
	`label` varchar(255),
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `integrations_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `partnerships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnershipType` enum('influencer','business') NOT NULL DEFAULT 'influencer',
	`influencerId` int,
	`partnerEstablishmentId` int,
	`establishmentId` int NOT NULL,
	`promoCodeId` int,
	`proposedBy` enum('influencer','establishment') NOT NULL,
	`status` enum('pending_estab','pending_support','active','rejected_estab','rejected_support','cancelled','expired') NOT NULL DEFAULT 'pending_estab',
	`terms` text,
	`estabNotes` text,
	`supportNotes` text,
	`startsAt` bigint,
	`expiresAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partnerships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photo_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`photoId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photo_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photo_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`photoId` int NOT NULL,
	`userId` int NOT NULL,
	`groupId` int NOT NULL,
	`comment` varchar(280),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photo_shares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promo_code_uses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codeId` int NOT NULL,
	`userId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`discountApplied` float,
	`usedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promo_code_uses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promo_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`type` enum('percentage','buy_one_get_one','free_item','fixed_discount') NOT NULL,
	`value` float,
	`description` text,
	`creatorId` int NOT NULL,
	`creatorType` enum('influencer','business') NOT NULL,
	`establishmentId` int,
	`startsAt` bigint,
	`expiresAt` bigint,
	`maxUses` int,
	`maxUsesPerUser` int DEFAULT 1,
	`firstVisitOnly` boolean NOT NULL DEFAULT false,
	`status` enum('pending_approval','active','rejected','expired','paused') NOT NULL DEFAULT 'pending_approval',
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promo_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `promo_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `qr_scans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`latitude` float,
	`longitude` float,
	`scannedAt` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qr_scans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rating_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ratingId` int NOT NULL,
	`userId` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`url` varchar(512) NOT NULL,
	`taggedItemIds` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rating_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`plan` enum('premium','embaixador') NOT NULL,
	`status` enum('active','cancelled','expired','past_due') NOT NULL DEFAULT 'active',
	`priceMonthly` float NOT NULL,
	`paymentMethod` enum('pix','credit_card','admin_grant') NOT NULL DEFAULT 'admin_grant',
	`startsAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supportUserId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`assignedBy` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `support_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`establishmentId` int,
	`content` text NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `support_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `survey_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phase` enum('onboarding','explorer','connoisseur') NOT NULL,
	`questionId` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` text,
	`type` enum('single','multi','score','text','birthdate','establishment') NOT NULL,
	`icon` varchar(64),
	`maxSelect` int,
	`lowScoreThreshold` int,
	`options` json,
	`lowScoreReasons` json,
	`parent_question_id` int,
	`trigger_option` varchar(500),
	`sortOrder` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `survey_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerId` int NOT NULL,
	`followingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_plans` MODIFY COLUMN `plan` enum('free','premium','embaixador') NOT NULL DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','owner','business','influencer','critic','support') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `categories` ADD `code` varchar(8);--> statement-breakpoint
ALTER TABLE `establishments` ADD `code` varchar(12);--> statement-breakpoint
ALTER TABLE `establishments` ADD `logo` text;--> statement-breakpoint
ALTER TABLE `establishments` ADD `description` text;--> statement-breakpoint
ALTER TABLE `establishments` ADD `complement` varchar(255);--> statement-breakpoint
ALTER TABLE `establishments` ADD `addressNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `establishments` ADD `status` enum('active','hidden','pending') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `groups` ADD `code` varchar(12);--> statement-breakpoint
ALTER TABLE `menu_items` ADD `code` varchar(12);--> statement-breakpoint
ALTER TABLE `rating_items` ADD `lowScoreReasons` json;--> statement-breakpoint
ALTER TABLE `rating_items` ADD `whatMissedForTen` text;--> statement-breakpoint
ALTER TABLE `ratings` ADD `code` varchar(12);--> statement-breakpoint
ALTER TABLE `ratings` ADD `source` enum('presencial','hibrido','remoto') DEFAULT 'remoto' NOT NULL;--> statement-breakpoint
ALTER TABLE `ratings` ADD `relevanceScore` int;--> statement-breakpoint
ALTER TABLE `users` ADD `code` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD `verified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lat` float;--> statement-breakpoint
ALTER TABLE `users` ADD `lng` float;--> statement-breakpoint
ALTER TABLE `users` ADD `locationUpdatedAt` bigint;--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_code_unique` UNIQUE(`code`);--> statement-breakpoint
ALTER TABLE `establishments` ADD CONSTRAINT `establishments_code_unique` UNIQUE(`code`);--> statement-breakpoint
ALTER TABLE `groups` ADD CONSTRAINT `groups_code_unique` UNIQUE(`code`);--> statement-breakpoint
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_code_unique` UNIQUE(`code`);--> statement-breakpoint
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_code_unique` UNIQUE(`code`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_code_unique` UNIQUE(`code`);--> statement-breakpoint
ALTER TABLE `establishments` DROP COLUMN `hidden`;