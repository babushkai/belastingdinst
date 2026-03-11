"use server";

import { db } from "@/lib/db";
import { contacts, invoices, transactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ContactSchema = z.object({
  companyName: z.string().min(1, "Bedrijfsnaam is verplicht").optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  btwNumber: z.string().optional(),
  kvkNumber: z.string().optional(),
  iban: z.string().optional(),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressPostcode: z.string().optional(),
  addressCountry: z.string().default("NL"),
});

export async function createContact(formData: FormData) {
  const data = ContactSchema.parse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    btwNumber: formData.get("btwNumber"),
    kvkNumber: formData.get("kvkNumber"),
    iban: formData.get("iban") || undefined,
    addressStreet: formData.get("addressStreet"),
    addressCity: formData.get("addressCity"),
    addressPostcode: formData.get("addressPostcode"),
    addressCountry: formData.get("addressCountry") || "NL",
  });

  const [contact] = await db.insert(contacts).values(data).returning();
  revalidatePath("/contacts");
  return contact;
}

export async function updateContact(id: string, formData: FormData) {
  const data = ContactSchema.parse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    btwNumber: formData.get("btwNumber"),
    kvkNumber: formData.get("kvkNumber"),
    iban: formData.get("iban") || undefined,
    addressStreet: formData.get("addressStreet"),
    addressCity: formData.get("addressCity"),
    addressPostcode: formData.get("addressPostcode"),
    addressCountry: formData.get("addressCountry") || "NL",
  });

  await db
    .update(contacts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(contacts.id, id));

  revalidatePath("/contacts");
}

export async function deleteContact(id: string) {
  // Guard: prevent delete if contact has invoices or transactions
  const [hasInvoices] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(invoices)
    .where(eq(invoices.contactId, id));

  if (hasInvoices.count > 0) {
    throw new Error(
      "Kan relatie niet verwijderen: er zijn gekoppelde facturen.",
    );
  }

  const [hasTransactions] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactions)
    .where(eq(transactions.contactId, id));

  if (hasTransactions.count > 0) {
    throw new Error(
      "Kan relatie niet verwijderen: er zijn gekoppelde transacties.",
    );
  }

  await db.delete(contacts).where(eq(contacts.id, id));
  revalidatePath("/contacts");
}
