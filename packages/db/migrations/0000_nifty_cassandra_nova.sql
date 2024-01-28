CREATE TABLE IF NOT EXISTS "facts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fact" text NOT NULL,
	"from_ben" boolean DEFAULT true,
	"is_enabled" boolean DEFAULT true
);
