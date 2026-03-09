CREATE TYPE "public"."btw_period_status" AS ENUM('open', 'calculated', 'filed');--> statement-breakpoint
CREATE TYPE "public"."period_type" AS ENUM('quarterly', 'monthly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."import_source" AS ENUM('ponto', 'mt940', 'camt053', 'manual');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'void');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('running', 'success', 'failed');--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"iban" text NOT NULL,
	"bank_name" text,
	"display_name" text,
	"ponto_account_id" text,
	"ponto_access_token_enc" text,
	"ponto_refresh_token_enc" text,
	"ponto_token_expires_at" timestamp,
	"last_synced_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bank_accounts_iban_unique" UNIQUE("iban")
);
--> statement-breakpoint
CREATE TABLE "btw_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_type" "period_type" NOT NULL,
	"year" integer NOT NULL,
	"period_number" integer NOT NULL,
	"status" "btw_period_status" DEFAULT 'open' NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"omzet_hoog_cents" integer DEFAULT 0 NOT NULL,
	"omzet_laag_cents" integer DEFAULT 0 NOT NULL,
	"omzet_nul_cents" integer DEFAULT 0 NOT NULL,
	"btw_hoog_cents" integer DEFAULT 0 NOT NULL,
	"btw_laag_cents" integer DEFAULT 0 NOT NULL,
	"btw_inkoop_cents" integer DEFAULT 0 NOT NULL,
	"btw_te_betalen_cents" integer DEFAULT 0 NOT NULL,
	"filed_at" timestamp,
	"pdf_path" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "btw_periods_year_period_unique" UNIQUE("year","period_number","period_type")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text,
	"contact_name" text,
	"email" text,
	"btw_number" text,
	"kvk_number" text,
	"address_street" text,
	"address_city" text,
	"address_postcode" text,
	"address_country" text DEFAULT 'NL' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_counters" (
	"year" integer PRIMARY KEY NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"btw_rate" integer NOT NULL,
	"btw_exempt_reason" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" text NOT NULL,
	"contact_id" uuid NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip" text NOT NULL,
	"attempted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"company_name" text NOT NULL,
	"kvk_number" text,
	"btw_number" text NOT NULL,
	"iban" text,
	"address_street" text,
	"address_city" text,
	"address_postcode" text,
	"invoice_prefix" text DEFAULT 'F' NOT NULL,
	"kor_active" boolean DEFAULT false NOT NULL,
	"default_btw_rate" integer DEFAULT 21 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "singleton_check" CHECK ("settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"source" text NOT NULL,
	"status" "sync_status" DEFAULT 'running' NOT NULL,
	"transactions_imported" integer DEFAULT 0 NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"value_date" date NOT NULL,
	"execution_date" date,
	"amount_cents" integer NOT NULL,
	"counterparty_name" text,
	"counterparty_iban" text,
	"description" text,
	"import_source" "import_source" NOT NULL,
	"contact_id" uuid,
	"invoice_id" uuid,
	"btw_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_bank_external_unique" UNIQUE("bank_account_id","external_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_log" ADD CONSTRAINT "sync_log_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;