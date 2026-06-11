CREATE TABLE "club_member" (
	"user_id" text NOT NULL,
	"club_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "club_member_user_id_club_id_pk" PRIMARY KEY("user_id","club_id")
);
--> statement-breakpoint
ALTER TABLE "club_member" ADD CONSTRAINT "club_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_member" ADD CONSTRAINT "club_member_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Backfill: every existing user becomes a member of their current home club.
INSERT INTO "club_member" ("user_id", "club_id", "created_at")
SELECT "id", "club_id", now() FROM "user" WHERE "club_id" IS NOT NULL
ON CONFLICT DO NOTHING;