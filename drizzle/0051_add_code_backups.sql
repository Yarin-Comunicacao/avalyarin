CREATE TABLE `code_backups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`backupId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`url` text NOT NULL,
	`sizeKB` int NOT NULL,
	`fileCount` int NOT NULL,
	CONSTRAINT `code_backups_id` PRIMARY KEY(`id`),
	CONSTRAINT `code_backups_backupId_unique` UNIQUE(`backupId`)
);
