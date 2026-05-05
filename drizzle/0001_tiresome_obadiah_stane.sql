CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(64),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `establishments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`neighborhood` varchar(128),
	`region` varchar(64),
	`lat` float,
	`lng` float,
	`rating` float,
	`reviewCount` int,
	`image` text,
	`hours` varchar(255),
	`phone` varchar(64),
	`instagram` varchar(128),
	`categoryId` int NOT NULL,
	`hasMenu` boolean NOT NULL DEFAULT false,
	`source` varchar(32) DEFAULT 'spreadsheet',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `establishments_id` PRIMARY KEY(`id`),
	CONSTRAINT `establishments_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` float,
	`category` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`)
);
