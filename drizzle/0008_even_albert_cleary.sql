CREATE TABLE "club_reservation_settings" (
	"club_id" text PRIMARY KEY NOT NULL,
	"timezone" text DEFAULT 'Europe/Madrid' NOT NULL,
	"hours" jsonb NOT NULL,
	"slot_duration" integer DEFAULT 60 NOT NULL,
	"default_booking_length" integer DEFAULT 90 NOT NULL,
	"min_advance_hours" integer DEFAULT 1 NOT NULL,
	"max_advance_days" integer DEFAULT 30 NOT NULL,
	"cancellation_cutoff_hours" integer DEFAULT 24 NOT NULL,
	"max_concurrent_per_player" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "club_reservation_settings" ADD CONSTRAINT "club_reservation_settings_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Backfill a default settings row (default opening hours + rule defaults) for
-- every existing club so the NOT NULL `hours` column is satisfied and every club
-- starts with enforceable booking rules.
INSERT INTO "club_reservation_settings" ("club_id", "hours", "created_at", "updated_at")
SELECT
	c."id",
	'{"mon":{"open":"08:00","close":"23:00","closed":false},"tue":{"open":"08:00","close":"23:00","closed":false},"wed":{"open":"08:00","close":"23:00","closed":false},"thu":{"open":"08:00","close":"23:00","closed":false},"fri":{"open":"08:00","close":"23:00","closed":false},"sat":{"open":"08:00","close":"23:00","closed":false},"sun":{"open":"08:00","close":"23:00","closed":true}}'::jsonb,
	now(),
	now()
FROM "club" c
ON CONFLICT ("club_id") DO NOTHING;