ALTER TABLE `survey_questions` ADD `minChars` int;--> statement-breakpoint
ALTER TABLE `survey_questions` ADD `maxChars` int;--> statement-breakpoint
ALTER TABLE `survey_questions` ADD `requireLetters` boolean;--> statement-breakpoint
ALTER TABLE `survey_questions` ADD `requireNumbers` boolean;--> statement-breakpoint
ALTER TABLE `survey_questions` ADD `requireSpecialChars` boolean;