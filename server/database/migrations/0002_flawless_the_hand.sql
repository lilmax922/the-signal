CREATE EXTENSION IF NOT EXISTS "pg_trgm";--> statement-breakpoint
CREATE INDEX "idx_signal_title_zh_trgm" ON "signal" USING gin ("title_zh" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_signal_title_en_trgm" ON "signal" USING gin ("title_en" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_tag_name_trgm" ON "tag" USING gin ("name" gin_trgm_ops);