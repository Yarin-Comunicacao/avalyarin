CREATE TABLE `survey_skip_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phase` enum('onboarding','explorer','connoisseur') NOT NULL,
	`trigger_question_id` varchar(64) NOT NULL,
	`trigger_value` varchar(255) NOT NULL,
	`skip_question_ids` json NOT NULL,
	`description` varchar(500),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `survey_skip_rules_id` PRIMARY KEY(`id`)
);
