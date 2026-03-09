import { db } from "@/lib/db";
import { invoices, contacts } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { InvoicesContent } from "@/components/InvoicesContent";

export default async function InvoicesPage() {
  const allInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      contactId: invoices.contactId,
      companyName: contacts.companyName,
      status: invoices.status,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      createdAt: invoices.createdAt,
      totalCents: sql<number>`coalesce((
        select sum(
          round(il.unit_price_cents * il.quantity::numeric)
          + round(round(il.unit_price_cents * il.quantity::numeric) * il.btw_rate / 100)
        )
        from invoice_lines il
        where il.invoice_id = ${invoices.id}
      ), 0)::int`,
    })
    .from(invoices)
    .leftJoin(contacts, eq(invoices.contactId, contacts.id))
    .orderBy(desc(invoices.createdAt));

  return (
    <InvoicesContent
      invoices={allInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        companyName: inv.companyName,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        status: inv.status,
        totalCents: inv.totalCents,
      }))}
    />
  );
}
