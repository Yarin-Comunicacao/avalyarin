ALTER TABLE `establishments` ADD `acceptsReservations` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `reservationMinAdvanceMinutes` int DEFAULT 30;--> statement-breakpoint
ALTER TABLE `group_events` ADD `rsvpDeadline` timestamp;
