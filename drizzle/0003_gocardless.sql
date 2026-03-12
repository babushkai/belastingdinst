-- GoCardless Bank Account Data integration

-- Add gocardless to import_source enum (cannot run inside transaction)
ALTER TYPE "import_source" ADD VALUE IF NOT EXISTS 'gocardless';

-- Add GoCardless columns to bank_accounts
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "gc_requisition_id" text;
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "gc_account_id" text;
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "gc_access_token_enc" text;
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "gc_refresh_token_enc" text;
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "gc_access_token_expires_at" timestamp;
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "gc_refresh_token_expires_at" timestamp;
