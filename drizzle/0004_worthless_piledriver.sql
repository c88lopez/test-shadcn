-- Multi-tenancy: introduce the `club` table and scope every domain table by
-- club_id. Hand-edited from the generated diff to be data-safe on existing
-- databases: add nullable columns, backfill all current rows to a Default Club,
-- then enforce NOT NULL + foreign keys. The `user` table stays nullable so
-- platform super-admins can have no club.

CREATE TABLE "club" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "club_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
INSERT INTO "club" ("id", "name", "slug", "status", "created_at")
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Club', 'default', 'active', now());
--> statement-breakpoint
ALTER TABLE "coach" ADD COLUMN "club_id" text;--> statement-breakpoint
ALTER TABLE "coach_class" ADD COLUMN "club_id" text;--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "club_id" text;--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "club_id" text;--> statement-breakpoint
ALTER TABLE "sale" ADD COLUMN "club_id" text;--> statement-breakpoint
ALTER TABLE "stock_item" ADD COLUMN "club_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "club_id" text;--> statement-breakpoint
UPDATE "coach" SET "club_id" = '00000000-0000-0000-0000-000000000001' WHERE "club_id" IS NULL;--> statement-breakpoint
UPDATE "coach_class" SET "club_id" = '00000000-0000-0000-0000-000000000001' WHERE "club_id" IS NULL;--> statement-breakpoint
UPDATE "player" SET "club_id" = '00000000-0000-0000-0000-000000000001' WHERE "club_id" IS NULL;--> statement-breakpoint
UPDATE "reservation" SET "club_id" = '00000000-0000-0000-0000-000000000001' WHERE "club_id" IS NULL;--> statement-breakpoint
UPDATE "sale" SET "club_id" = '00000000-0000-0000-0000-000000000001' WHERE "club_id" IS NULL;--> statement-breakpoint
UPDATE "stock_item" SET "club_id" = '00000000-0000-0000-0000-000000000001' WHERE "club_id" IS NULL;--> statement-breakpoint
UPDATE "user" SET "club_id" = '00000000-0000-0000-0000-000000000001' WHERE "club_id" IS NULL;--> statement-breakpoint
ALTER TABLE "coach" ALTER COLUMN "club_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "coach_class" ALTER COLUMN "club_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "player" ALTER COLUMN "club_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "reservation" ALTER COLUMN "club_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sale" ALTER COLUMN "club_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_item" ALTER COLUMN "club_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "coach" ADD CONSTRAINT "coach_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_class" ADD CONSTRAINT "coach_class_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_item" ADD CONSTRAINT "stock_item_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE cascade ON UPDATE no action;
