import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { eq, and, lt, isNotNull } from "drizzle-orm";

export async function markOverdueInvoices(): Promise<{ markedCount: number }> {
  const today = new Date().toISOString().split("T")[0];

  const result = await db
    .update(invoices)
    .set({ status: "overdue", updatedAt: new Date() })
    .where(
      and(
        eq(invoices.status, "sent"),
        isNotNull(invoices.dueDate),
        lt(invoices.dueDate, today),
      ),
    )
    .returning({ id: invoices.id });

  return { markedCount: result.length };
}
