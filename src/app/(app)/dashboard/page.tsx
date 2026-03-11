import { db } from "@/lib/db";
import { invoices, btwPeriods, syncLog } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { DashboardContent } from "@/components/DashboardContent";
import { markOverdueInvoices } from "@/lib/invoices/overdue";
import { getTaxDeadlines } from "@/lib/tax-calendar";

export default async function DashboardPage() {
  // Mark overdue invoices on page load
  await markOverdueInvoices();

  const [openInvoices] = await db
    .select({
      count: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(
        (select sum(
          round(il.unit_price_cents * il.quantity::numeric)
          + round(round(il.unit_price_cents * il.quantity::numeric) * il.btw_rate / 100)
        ) from invoice_lines il where il.invoice_id = invoices.id)
      ), 0)::int`,
    })
    .from(invoices)
    .where(eq(invoices.status, "sent"));

  const [overdueInvoices] = await db
    .select({
      count: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(
        (select sum(
          round(il.unit_price_cents * il.quantity::numeric)
          + round(round(il.unit_price_cents * il.quantity::numeric) * il.btw_rate / 100)
        ) from invoice_lines il where il.invoice_id = invoices.id)
      ), 0)::int`,
    })
    .from(invoices)
    .where(eq(invoices.status, "overdue"));

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

  // Tax deadlines for current year
  const currentYear = new Date().getFullYear();
  const filedPeriods = await db
    .select({ periodNumber: btwPeriods.periodNumber })
    .from(btwPeriods)
    .where(
      and(
        eq(btwPeriods.year, currentYear),
        eq(btwPeriods.status, "filed"),
      ),
    );
  const filedQuarters = filedPeriods.map((p) => p.periodNumber);
  const deadlines = getTaxDeadlines(currentYear, filedQuarters);

  return (
    <DashboardContent
      data={{
        openCount: openInvoices?.count ?? 0,
        openTotalCents: openInvoices?.total ?? 0,
        overdueCount: overdueInvoices?.count ?? 0,
        overdueTotalCents: overdueInvoices?.total ?? 0,
        currentBtw: currentBtw
          ? {
              periodNumber: currentBtw.periodNumber,
              year: currentBtw.year,
              status: currentBtw.status,
            }
          : null,
        lastSyncDate: lastSync?.startedAt
          ? lastSync.startedAt.toISOString()
          : null,
        deadlines: deadlines.map((d) => ({
          label: d.label,
          dueDate: d.dueDate,
          type: d.type,
          urgent: d.urgent,
          overdue: d.overdue,
        })),
      }}
    />
  );
}
