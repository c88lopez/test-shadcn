CREATE TABLE "court" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'indoor' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"club_id" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coach_class" ADD COLUMN "court_id" text;--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "court_id" text;--> statement-breakpoint
ALTER TABLE "court" ADD CONSTRAINT "court_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_class" ADD CONSTRAINT "coach_class_court_id_court_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."court"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_court_id_court_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."court"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
-- Backfill: give every existing club a default set of 6 courts (numbered 1..6).
-- sort_order doubles as the human court number used to map existing rows.
INSERT INTO "court" ("id", "name", "type", "active", "sort_order", "club_id", "created_at")
SELECT gen_random_uuid()::text, 'Court ' || n.num, 'indoor', true, n.num, c.id, now()
FROM "club" c
CROSS JOIN generate_series(1, 6) AS n(num);--> statement-breakpoint
-- Ensure courts exist for any court numbers already referenced by data that
-- fall outside the default 1..6 range.
INSERT INTO "court" ("id", "name", "type", "active", "sort_order", "club_id", "created_at")
SELECT gen_random_uuid()::text, 'Court ' || x.num, 'indoor', true, x.num, x.club_id, now()
FROM (
	SELECT DISTINCT "club_id", "court" AS num FROM "reservation"
	UNION
	SELECT DISTINCT "club_id", "court" AS num FROM "coach_class"
) x
WHERE NOT EXISTS (
	SELECT 1 FROM "court" ct WHERE ct."club_id" = x."club_id" AND ct."sort_order" = x.num
);--> statement-breakpoint
-- Map existing reservations/classes to their court by (club, number).
UPDATE "reservation" r SET "court_id" = ct."id"
FROM "court" ct WHERE ct."club_id" = r."club_id" AND ct."sort_order" = r."court";--> statement-breakpoint
UPDATE "coach_class" cc SET "court_id" = ct."id"
FROM "court" ct WHERE ct."club_id" = cc."club_id" AND ct."sort_order" = cc."court";