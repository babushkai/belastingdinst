import { db } from "@/lib/db";
import { invoices, btwPeriods, syncLog } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";

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
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <h2 className="text-sm text-gray-500">Openstaande facturen</h2>
          <p className="text-2xl font-bold">
            {openInvoices?.count ?? 0}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-sm text-gray-500">BTW periode</h2>
          <p className="text-2xl font-bold">
            {currentBtw
              ? `Q${currentBtw.periodNumber} ${currentBtw.year}`
              : "Geen"}
          </p>
          <p className="text-sm text-gray-500">
            {currentBtw?.status ?? ""}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-sm text-gray-500">Laatste bank sync</h2>
          <p className="text-sm">
            {lastSync?.startedAt
              ? lastSync.startedAt.toLocaleDateString("nl-NL")
              : "Nog niet gesynchroniseerd"}
          </p>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <a
          href="/invoices/new"
          className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Nieuwe factuur
        </a>
        <a
          href="/bank/import"
          className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Bank import
        </a>
      </div>
    </div>
  );
}
