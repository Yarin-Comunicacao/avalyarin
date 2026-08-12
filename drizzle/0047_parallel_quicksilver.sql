ALTER TABLE `establishments` MODIFY COLUMN `acceptsReservations` boolean NOT NULL DEFAULT false;--> statement-breakpoint
UPDATE `establishments` SET `acceptsReservations` = false;--> statement-breakpoint
