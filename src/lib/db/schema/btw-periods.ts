import {
  pgTable,
  pgEnum,
  uuid,
  integer,
  boolean,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const periodTypeEnum = pgEnum("period_type", [
  "quarterly",
  "monthly",
  "annual",
]);

export const btwPeriodStatusEnum = pgEnum("btw_period_status", [
  "open",
  "calculated",
  "filed",
]);

export const btwPeriods = pgTable(
  "btw_periods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    periodType: periodTypeEnum("period_type").notNull(),
    year: integer("year").notNull(),
    periodNumber: integer("period_number").notNull(),
    status: btwPeriodStatusEnum("status").notNull().default("open"),
    locked: boolean("locked").notNull().default(false),
    omzetHoogCents: integer("omzet_hoog_cents").notNull().default(0),
    omzetLaagCents: integer("omzet_laag_cents").notNull().default(0),
    omzetNulCents: integer("omzet_nul_cents").notNull().default(0),
    btwHoogCents: integer("btw_hoog_cents").notNull().default(0),
    btwLaagCents: integer("btw_laag_cents").notNull().default(0),
    btwInkoopCents: integer("btw_inkoop_cents").notNull().default(0),
    btwTeBetalen: integer("btw_te_betalen_cents").notNull().default(0),
    filedAt: timestamp("filed_at"),
    pdfPath: text("pdf_path"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("btw_periods_year_period_unique").on(
      table.year,
      table.periodNumber,
      table.periodType,
    ),
  ],
);
