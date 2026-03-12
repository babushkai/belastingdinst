import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  iban: text("iban").notNull().unique(),
  bankName: text("bank_name"),
  displayName: text("display_name"),
  wiseProfileId: text("wise_profile_id"),
  wiseAccountId: text("wise_account_id"),
  wiseApiTokenEnc: text("wise_api_token_enc"),
  lastSyncedAt: timestamp("last_synced_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
