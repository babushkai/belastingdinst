import {
  pgTable,
  pgEnum,
  uuid,
  text,
  date,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { contacts } from "./contacts";

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "void",
]);

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  contactId: uuid("contact_id")
    .notNull()
    .references(() => contacts.id),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date"),
  currency: text("currency").notNull().default("EUR"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invoiceLines = pgTable("invoice_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  btwRate: integer("btw_rate").notNull(), // 0, 9, or 21
  btwExemptReason: text("btw_exempt_reason"), // for 0% lines
  sortOrder: integer("sort_order").notNull().default(0),
});

export const invoiceCounters = pgTable(
  "invoice_counters",
  {
    year: integer("year").primaryKey(),
    lastNumber: integer("last_number").notNull().default(0),
  },
);
