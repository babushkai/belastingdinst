"use server";

import { db } from "@/lib/db";
import { invoices, invoiceLines } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateInvoiceNumber } from "./number";
import { assertPeriodNotLocked } from "@/lib/btw/period-guard";

const InvoiceLineSchema = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitPriceCents: z.coerce.number().int(),
  btwRate: z.coerce.number().int().refine((v) => [0, 9, 21].includes(v)),
  btwExemptReason: z.string().optional(),
});

const CreateInvoiceSchema = z.object({
  contactId: z.string().uuid(),
  issueDate: z.string(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(InvoiceLineSchema).min(1),
});

export async function createInvoice(input: z.infer<typeof CreateInvoiceSchema>) {
  const data = CreateInvoiceSchema.parse(input);
  const year = new Date(data.issueDate).getFullYear();

  const result = await db.transaction(async (tx) => {
    const invoiceNumber = await generateInvoiceNumber(tx, year);

    const [invoice] = await tx
      .insert(invoices)
      .values({
        invoiceNumber,
        contactId: data.contactId,
        issueDate: data.issueDate,
        dueDate: data.dueDate || null,
        notes: data.notes || null,
      })
      .returning();

    const lineValues = data.lines.map((line, idx) => ({
      invoiceId: invoice.id,
      description: line.description,
      quantity: line.quantity.toString(),
      unitPriceCents: line.unitPriceCents,
      btwRate: line.btwRate,
      btwExemptReason: line.btwExemptReason || null,
      sortOrder: idx,
    }));

    await tx.insert(invoiceLines).values(lineValues);

    return invoice;
  });

  revalidatePath("/invoices");
  return result;
}

export async function updateInvoiceStatus(
  id: string,
  status: "draft" | "sent" | "paid" | "overdue" | "void",
) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);

  if (!invoice) throw new Error("Factuur niet gevonden");

  await assertPeriodNotLocked(invoice.issueDate);

  await db
    .update(invoices)
    .set({ status, updatedAt: new Date() })
    .where(eq(invoices.id, id));

  revalidatePath("/invoices");
}

export async function deleteInvoice(id: string) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);

  if (!invoice) throw new Error("Factuur niet gevonden");
  if (invoice.status !== "draft") {
    throw new Error("Alleen conceptfacturen kunnen worden verwijderd.");
  }

  await assertPeriodNotLocked(invoice.issueDate);

  await db.delete(invoices).where(eq(invoices.id, id));
  revalidatePath("/invoices");
}
