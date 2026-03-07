import { pgTable, integer, text, boolean, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const settings = pgTable(
  "settings",
  {
    id: integer("id").primaryKey().default(1),
    companyName: text("company_name").notNull(),
    kvkNumber: text("kvk_number"),
    btwNumber: text("btw_number").notNull(),
    iban: text("iban"),
    addressStreet: text("address_street"),
    addressCity: text("address_city"),
    addressPostcode: text("address_postcode"),
    invoicePrefix: text("invoice_prefix").notNull().default("F"),
    korActive: boolean("kor_active").notNull().default(false),
    defaultBtwRate: integer("default_btw_rate").notNull().default(21),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [check("singleton_check", sql`${table.id} = 1`)],
);
