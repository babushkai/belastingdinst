import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: text("company_name"),
  contactName: text("contact_name"),
  email: text("email"),
  btwNumber: text("btw_number"),
  kvkNumber: text("kvk_number"),
  addressStreet: text("address_street"),
  addressCity: text("address_city"),
  addressPostcode: text("address_postcode"),
  addressCountry: text("address_country").notNull().default("NL"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
