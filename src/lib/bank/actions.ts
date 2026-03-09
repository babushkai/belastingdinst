"use server";

import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { assertPeriodNotLocked } from "@/lib/btw/period-guard";
import { upsertInferenceRule, deleteInferenceRule } from "./btw-inference-rules";
import { normalizeCounterpartyName } from "./normalize-counterparty";
import { z } from "zod";

const BtwCodeSchema = z.enum(["0", "9", "21"]).nullable();

export async function updateTransactionBtwCode(
  transactionId: string,
  btwCode: string | null,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Niet ingelogd" };

  const parsed = BtwCodeSchema.safeParse(btwCode);
  if (!parsed.success) {
    return { error: "Ongeldige BTW-code" };
  }

  const [tx] = await db
    .select({
      valueDate: transactions.valueDate,
      counterpartyName: transactions.counterpartyName,
      counterpartyIban: transactions.counterpartyIban,
    })
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);

  if (!tx) return { error: "Transactie niet gevonden" };

  try {
    await assertPeriodNotLocked(tx.valueDate);
  } catch {
    return { error: "BTW-periode is vergrendeld" };
  }

  await db
    .update(transactions)
    .set({
      btwCode: parsed.data,
      btwCodeSource: "manual",
      btwCodeSuggested: null,
    })
    .where(eq(transactions.id, transactionId));

  // Learn from single manual edit
  if (tx.counterpartyName) {
    const normalized = normalizeCounterpartyName(tx.counterpartyName);
    if (normalized) {
      if (parsed.data) {
        // Setting a code → teach the system
        await upsertInferenceRule(
          session.user.id,
          tx.counterpartyName,
          tx.counterpartyIban,
          parsed.data,
        );
      } else {
        // Clearing a code → delete stale learned rule
        await deleteInferenceRule(session.user.id, tx.counterpartyName);
      }
    }
  }

  revalidatePath("/bank/transactions");
  return {};
}

export async function batchUpdateTransactionBtwCode(
  ids: string[],
  btwCode: string | null,
): Promise<{ updated: number; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { updated: 0, error: "Niet ingelogd" };

  const parsed = BtwCodeSchema.safeParse(btwCode);
  if (!parsed.success) {
    return { updated: 0, error: "Ongeldige BTW-code" };
  }

  if (ids.length === 0) return { updated: 0 };

  // Fetch all valueDates to check period locks
  const rows = await db
    .select({ id: transactions.id, valueDate: transactions.valueDate })
    .from(transactions)
    .where(inArray(transactions.id, ids));

  // Fail-fast: check all periods before updating any
  const uniqueDates = [...new Set(rows.map((r) => r.valueDate))];
  for (const date of uniqueDates) {
    try {
      await assertPeriodNotLocked(date);
    } catch {
      return { updated: 0, error: `BTW-periode voor ${date} is vergrendeld` };
    }
  }

  // Bulk update — no learning (batch edits are not teachable signals)
  await db
    .update(transactions)
    .set({
      btwCode: parsed.data,
      btwCodeSource: "manual",
      btwCodeSuggested: null,
    })
    .where(inArray(transactions.id, ids));

  revalidatePath("/bank/transactions");
  return { updated: rows.length };
}
