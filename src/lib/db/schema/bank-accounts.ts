import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  iban: text("iban").notNull().unique(),
  bankName: text("bank_name"),
  displayName: text("display_name"),
  pontoAccountId: text("ponto_account_id"),
  pontoAccessTokenEnc: text("ponto_access_token_enc"),
  pontoRefreshTokenEnc: text("ponto_refresh_token_enc"),
  pontoTokenExpiresAt: timestamp("ponto_token_expires_at"),
  lastSyncedAt: timestamp("last_synced_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
