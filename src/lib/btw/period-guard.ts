import { db } from "@/lib/db";
import { btwPeriods } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export class PeriodLockedError extends Error {
  constructor(message: string = "Kan niet wijzigen: BTW-periode is vergrendeld.") {
    super(message);
    this.name = "PeriodLockedError";
  }
}

/**
 * Checks if the date falls within a locked BTW period.
 * Throws PeriodLockedError if a locked period covers this date.
 * Accepts a date string (YYYY-MM-DD) to avoid timezone issues.
 */
export async function assertPeriodNotLocked(date: Date | string): Promise<void> {
  // Parse date string directly to avoid timezone shifting
  const dateStr = typeof date === "string" ? date : date.toISOString().split("T")[0];
  const parts = dateStr.split("-");
  const yearStr = parts[0];
  const monthStr = parts[1];
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const quarter = Math.ceil(month / 3);

  const lockedPeriods = await db
    .select()
    .from(btwPeriods)
    .where(
      and(
        eq(btwPeriods.year, year),
        eq(btwPeriods.locked, true),
      ),
    );

  for (const period of lockedPeriods) {
    if (period.periodType === "quarterly" && period.periodNumber === quarter) {
      throw new PeriodLockedError();
    }
    if (period.periodType === "monthly" && period.periodNumber === month) {
      throw new PeriodLockedError();
    }
    if (period.periodType === "annual") {
      throw new PeriodLockedError();
    }
  }
}
