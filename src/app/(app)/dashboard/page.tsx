import { db } from "@/lib/db";
import { invoices, btwPeriods, syncLog } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { DashboardContent } from "@/components/DashboardContent";

export default async function DashboardPage() {
  const [openInvoices] = await db
    .select({
      count: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(
        (select sum(il.unit_price_cents * il.quantity::int) from invoice_lines il where il.invoice_id = invoices.id)
      ), 0)::int`,
    })
    .from(invoices)
    .where(eq(invoices.status, "sent"));

  const [currentBtw] = await db
    .select()
    .from(btwPeriods)
    .orderBy(desc(btwPeriods.year), desc(btwPeriods.periodNumber))
    .limit(1);

  const [lastSync] = await db
    .select()
    .from(syncLog)
    .orderBy(desc(syncLog.startedAt))
    .limit(1);

  return (
    <DashboardContent
      data={{
        openCount: openInvoices?.count ?? 0,
        currentBtw: currentBtw
          ? {
              periodNumber: currentBtw.periodNumber,
              year: currentBtw.year,
              status: currentBtw.status,
            }
          : null,
        lastSyncDate: lastSync?.startedAt
          ? lastSync.startedAt.toLocaleDateString("nl-NL")
          : null,
      }}
    />
  );
}
