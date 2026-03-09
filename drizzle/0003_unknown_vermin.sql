CREATE TABLE "btw_inference_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"normalized_name" text NOT NULL,
	"raw_name_sample" text,
	"counterparty_iban" text,
	"btw_code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "btw_code_suggested" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "inference_rule_id" uuid;--> statement-breakpoint
ALTER TABLE "btw_inference_rules" ADD CONSTRAINT "btw_inference_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "btw_inference_rules_user_name_idx" ON "btw_inference_rules" USING btree ("user_id","normalized_name");--> statement-breakpoint
CREATE INDEX "btw_inference_rules_iban_idx" ON "btw_inference_rules" USING btree ("counterparty_iban");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_inference_rule_id_btw_inference_rules_id_fk" FOREIGN KEY ("inference_rule_id") REFERENCES "public"."btw_inference_rules"("id") ON DELETE no action ON UPDATE no action;