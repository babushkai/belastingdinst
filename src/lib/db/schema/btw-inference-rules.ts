import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./users";

export const btwInferenceRules = pgTable(
  "btw_inference_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    normalizedName: text("normalized_name").notNull(),
    rawNameSample: text("raw_name_sample"),
    counterpartyIban: text("counterparty_iban"),
    btwCode: text("btw_code").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("btw_inference_rules_user_name_idx").on(
      table.userId,
      table.normalizedName,
    ),
  ],
);
