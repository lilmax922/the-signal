CREATE TYPE "public"."category" AS ENUM('finance', 'tech', 'world');--> statement-breakpoint
CREATE TABLE "signal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"guid" text NOT NULL,
	"category" "category" NOT NULL,
	"title_en" text NOT NULL,
	"title_zh" text NOT NULL,
	"content_en" text NOT NULL,
	"content_zh" text NOT NULL,
	"summary_zh" text[] NOT NULL,
	"image_url" text,
	"image_alt" text,
	"source_url" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"pipeline_run_id" text,
	CONSTRAINT "signal_slug_unique" UNIQUE("slug"),
	CONSTRAINT "signal_guid_unique" UNIQUE("guid")
);
--> statement-breakpoint
CREATE TABLE "signal_tag" (
	"signal_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "signal_tag_signal_id_tag_id_pk" PRIMARY KEY("signal_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tag_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "signal_tag" ADD CONSTRAINT "signal_tag_signal_id_signal_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."signal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal_tag" ADD CONSTRAINT "signal_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_signal_category_published" ON "signal" USING btree ("category","published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_signal_published_at" ON "signal" USING btree ("published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_signal_tag_signal_id" ON "signal_tag" USING btree ("signal_id");--> statement-breakpoint
CREATE INDEX "idx_signal_tag_tag_id" ON "signal_tag" USING btree ("tag_id");