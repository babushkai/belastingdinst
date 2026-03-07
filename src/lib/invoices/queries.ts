import { db } from "@/lib/db";
import { invoices, invoiceLines, contacts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getInvoices() {
  return db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      contactId: invoices.contactId,
      companyName: contacts.companyName,
      status: invoices.status,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .leftJoin(contacts, eq(invoices.contactId, contacts.id))
    .orderBy(desc(invoices.createdAt));
}

export async function getInvoiceById(id: string) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);

  if (!invoice) return null;

  const lines = await db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, id))
    .orderBy(invoiceLines.sortOrder);

  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, invoice.contactId))
    .limit(1);

  return { invoice, lines, contact };
}
