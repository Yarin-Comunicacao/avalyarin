CREATE TABLE `bug_reports` (
  `id` int AUTO_INCREMENT NOT NULL,
  `code` varchar(16),
  `createdById` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` enum('bug','broken_route','performance','content','account','other') DEFAULT 'bug' NOT NULL,
  `severity` enum('low','medium','high','critical') DEFAULT 'medium' NOT NULL,
  `status` enum('open','triaged','in_progress','resolved','closed') DEFAULT 'open' NOT NULL,
  `routePath` varchar(512),
  `platform` varchar(32),
  `userAgent` varchar(512),
  `viewport` varchar(32),
  `online` boolean,
  `appVersion` varchar(64),
  `errorMessage` text,
  `contextJson` text,
  `assignedToId` int,
  `resolution` text,
  `resolvedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `bug_reports_id` PRIMARY KEY(`id`),
  CONSTRAINT `bug_reports_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE INDEX `bug_reports_status_idx` ON `bug_reports` (`status`);
--> statement-breakpoint
CREATE INDEX `bug_reports_created_by_idx` ON `bug_reports` (`createdById`);
--> statement-breakpoint
CREATE INDEX `bug_reports_created_at_idx` ON `bug_reports` (`createdAt`);
