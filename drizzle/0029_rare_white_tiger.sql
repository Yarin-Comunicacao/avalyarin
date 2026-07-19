CREATE TABLE `photo_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`photoId` int NOT NULL,
	`ratingId` int NOT NULL,
	`verified` boolean NOT NULL DEFAULT false,
	`confidence` varchar(20) NOT NULL DEFAULT 'low',
	`matchesClaimedItem` boolean NOT NULL DEFAULT false,
	`multipleItemsDetected` boolean NOT NULL DEFAULT false,
	`detectedItems` text,
	`suggestedItemMatches` text,
	`reason` text,
	`rawAnalysis` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photo_verifications_id` PRIMARY KEY(`id`)
);
