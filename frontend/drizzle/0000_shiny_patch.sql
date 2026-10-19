CREATE TABLE `live_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`last_request_id` text NOT NULL,
	`state_json` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `live_sessions_owner_updated` ON `live_sessions` (`owner_id`,`updated_at`);