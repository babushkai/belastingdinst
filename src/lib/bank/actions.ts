"use server";

import { db } from "@/lib/db";
import { transactions, invoices, contacts } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { learnFromCategorisation } from "./inference";
import { getDefaultUserId } from "@/lib/auth/helpers";
import { updateInvoiceStatus } from "@/lib/invoices/actions";

const VALID_BTW_CODES = ["0", "9", "21"] as const;

const CategoriseSchema = z.object({
  btwCode: z
    .string()
    .nullable()
    .refine(
      (v) => v === null || (VALID_BTW_CODES as readonly string[]).includes(v),
      { message: "Invalid BTW code" },
    ),
});

export async function categoriseTransaction(
  id: string,
  input: { btwCode: string | null },
) {
  const data = CategoriseSchema.parse(input);

  const [tx] = await db
    .select({
      id: transactions.id,
      counterpartyName: transactions.counterpartyName,
      counterpartyIban: transactions.counterpartyIban,
    })
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);

  if (!tx) throw new Error("Transactie niet gevonden");

  await db
    .update(transactions)
    .set({ btwCode: data.btwCode, btwCodeSource: data.btwCode ? "manual" : null })
    .where(eq(transactions.id, id));

  // Learn from manual categorisation
  if (data.btwCode && (tx.counterpartyName || tx.counterpartyIban)) {
    const userId = await getDefaultUserId();
    await learnFromCategorisation(
      userId,
      { counterpartyName: tx.counterpartyName, counterpartyIban: tx.counterpartyIban },
      data.btwCode,
    );
  }

  revalidatePath("/bank/transactions");
}

export async function linkTransactionToInvoice(
  txId: string,
  invoiceId: string,
) {
  await db.transaction(async (trx) => {
    const [tx] = await trx
      .select({ id: transactions.id, amountCents: transactions.amountCents })
      .from(transactions)
      .where(eq(transactions.id, txId))
      .limit(1);

    if (!tx) throw new Error("Transactie niet gevonden");

    const [invoice] = await trx
      .select({ id: invoices.id, status: invoices.status, contactId: invoices.contactId })
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoice) throw new Error("Factuur niet gevonden");
    if (invoice.status !== "sent" && invoice.status !== "overdue") {
      throw new Error("Factuur is niet openstaand");
    }

    // Link transaction to invoice
    await trx
      .update(transactions)
      .set({
        invoiceId: invoice.id,
        contactId: invoice.contactId,
      })
      .where(eq(transactions.id, txId));
  });

  // Mark invoice as paid outside transaction (uses its own VALID_TRANSITIONS guard + period lock)
  await updateInvoiceStatus(invoiceId, "paid");

  revalidatePath("/bank/transactions");
  revalidatePath("/invoices");
}

export async function findMatchCandidates(txId: string) {
  const [tx] = await db
    .select({
      id: transactions.id,
      amountCents: transactions.amountCents,
      counterpartyIban: transactions.counterpartyIban,
    })
    .from(transactions)
    .where(eq(transactions.id, txId))
    .limit(1);

  if (!tx || tx.amountCents <= 0 || !tx.counterpartyIban) return [];

  // Find sent/overdue invoices where contact IBAN matches counterparty
  const candidates = await db
    .select({
      invoiceId: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      contactName: contacts.companyName,
    })
    .from(invoices)
    .innerJoin(contacts, eq(invoices.contactId, contacts.id))
    .where(
      and(
        ne(invoices.status, "void"),
        ne(invoices.status, "draft"),
        ne(invoices.status, "paid"),
        eq(contacts.iban, tx.counterpartyIban),
      ),
    )
    .limit(10);

  return candidates.map((c) => ({
    invoiceId: c.invoiceId,
    invoiceNumber: c.invoiceNumber,
    contactName: c.contactName,
    confidence: "high" as const,
  }));
}
