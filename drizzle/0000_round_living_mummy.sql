CREATE TABLE `catches` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`temperature` real,
	`temperature_unit` text DEFAULT 'C',
	`weather_condition` text,
	`pressure` real,
	`pressure_unit` text DEFAULT 'hPa',
	`humidity` real,
	`wind_speed` real,
	`weather_fetched_at` integer,
	`species` text,
	`weight` real,
	`weight_unit` text DEFAULT 'kg',
	`length` real,
	`length_unit` text DEFAULT 'cm',
	`lure` text,
	`notes` text,
	`photo_uri` text,
	`is_draft` integer DEFAULT true,
	`pending_weather_fetch` integer DEFAULT true,
	`synced_at` integer
);
--> statement-breakpoint
CREATE TABLE `species` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`common_names` text,
	`category` text
);
