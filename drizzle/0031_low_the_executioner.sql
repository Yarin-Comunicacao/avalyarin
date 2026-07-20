CREATE TABLE `content_moderation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetType` enum('photo','comment','rating_text') NOT NULL,
	`targetId` int NOT NULL,
	`ratingId` int,
	`userId` int NOT NULL,
	`status` enum('approved','flagged','rejected','pending') NOT NULL DEFAULT 'pending',
	`categories` text,
	`severity` enum('none','low','medium','high','critical') NOT NULL DEFAULT 'none',
	`confidence` float,
	`reason` text,
	`rawAnalysis` text,
	`reviewedBy` int,
	`reviewAction` enum('approve','remove','warn','ban'),
	`reviewNote` text,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_moderation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`targetType` enum('rating','photo','comment','user') NOT NULL,
	`targetId` int NOT NULL,
	`targetUserId` int,
	`reason` enum('sexual_content','hate_speech','violence','financial_scam','phishing','false_identity','cloaking','account_integrity','misinformation','restricted_goods','cybersecurity','spam','other') NOT NULL,
	`description` text,
	`status` enum('pending','reviewed','dismissed','actioned') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewAction` enum('dismiss','warn','remove_content','ban_user'),
	`reviewNote` text,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
