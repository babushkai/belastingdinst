import {
  pgTable,
  pgEnum,
  uuid,
  text,
  date,
  integer,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { bankAccounts } from "./bank-accounts";
import { contacts } from "./contacts";
import { invoices } from "./invoices";
import { btwInferenceRules } from "./btw-inference-rules";

export const importSourceEnum = pgEnum("import_source", [
  "ponto",
  "mt940",
  "camt053",
  "manual",
  "wise",
]);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bankAccountId: uuid("bank_account_id")
      .notNull()
      .references(() => bankAccounts.id),
    externalId: text("external_id").notNull(),
    valueDate: date("value_date").notNull(),
    executionDate: date("execution_date"),
    amountCents: integer("amount_cents").notNull(),
    counterpartyName: text("counterparty_name"),
    counterpartyIban: text("counterparty_iban"),
    description: text("description"),
    importSource: importSourceEnum("import_source").notNull(),
    contactId: uuid("contact_id").references(() => contacts.id),
    invoiceId: uuid("invoice_id").references(() => invoices.id),
    btwCode: text("btw_code"),
    btwCodeSource: text("btw_code_source"),
    btwCodeSuggested: text("btw_code_suggested"),
    inferenceRuleId: uuid("inference_rule_id").references(() => btwInferenceRules.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("transactions_bank_external_unique").on(
      table.bankAccountId,
      table.externalId,
    ),
  ],
);
