import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const loginAttempts = pgTable("login_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  ip: text("ip").notNull(),
  attemptedAt: timestamp("attempted_at").notNull().defaultNow(),
});
