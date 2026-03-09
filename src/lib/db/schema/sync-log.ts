import {
  pgTable,
  pgEnum,
  uuid,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { bankAccounts } from "./bank-accounts";

export const syncStatusEnum = pgEnum("sync_status", [
  "running",
  "success",
  "failed",
]);

export const syncLog = pgTable("sync_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  bankAccountId: uuid("bank_account_id")
    .notNull()
    .references(() => bankAccounts.id),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  source: text("source").notNull(), // ponto, mt940, camt053, manual
  status: syncStatusEnum("status").notNull().default("running"),
  transactionsImported: integer("transactions_imported").notNull().default(0),
  errorMessage: text("error_message"),
});
