ALTER TABLE "coach_class" ALTER COLUMN "court_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "reservation" ALTER COLUMN "court_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "coach_class" DROP COLUMN "court";--> statement-breakpoint
ALTER TABLE "reservation" DROP COLUMN "court";