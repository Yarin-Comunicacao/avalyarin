ALTER TABLE `establishments` ADD `hidden` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `menu_items` ADD `imageUrl` text;--> statement-breakpoint
ALTER TABLE `menu_items` ADD `imageKey` varchar(512);