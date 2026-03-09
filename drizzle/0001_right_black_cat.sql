ALTER TYPE "public"."import_source" ADD VALUE 'wise';--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "wise_profile_id" text;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "wise_account_id" text;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "wise_api_token_enc" text;