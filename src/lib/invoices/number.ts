import { db } from "@/lib/db";
import { invoiceCounters } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Generates the next gapless invoice number for the given year.
 * Uses SELECT ... FOR UPDATE to prevent race conditions.
 * Must be called within a database transaction.
 *
 * Format: YYYY-NNNN (e.g., 2026-0001)
 */
export async function generateInvoiceNumber(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  year: number,
): Promise<string> {
  // Ensure counter row exists for this year
  await tx
    .insert(invoiceCounters)
    .values({ year, lastNumber: 0 })
    .onConflictDoNothing();

  // Lock and increment atomically
  const [result] = await tx
    .update(invoiceCounters)
    .set({ lastNumber: sql`${invoiceCounters.lastNumber} + 1` })
    .where(eq(invoiceCounters.year, year))
    .returning({ lastNumber: invoiceCounters.lastNumber });

  const num = result.lastNumber.toString().padStart(4, "0");
  return `${year}-${num}`;
}
