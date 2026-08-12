ALTER TABLE `business_claims` ADD `businessRole` enum('owner','manager','staff') DEFAULT 'owner' NOT NULL;--> statement-breakpoint
ALTER TABLE `business_claims` ADD `invitedBy` int;