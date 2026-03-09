"use server";

import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { assertPeriodNotLocked } from "@/lib/btw/period-guard";
import { z } from "zod";

const BtwCodeSchema = z.enum(["0", "9", "21"]).nullable();

export async function updateTransactionBtwCode(
  transactionId: string,
  btwCode: string | null,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session) return { error: "Niet ingelogd" };

  const parsed = BtwCodeSchema.safeParse(btwCode);
  if (!parsed.success) {
    return { error: "Ongeldige BTW-code" };
  }

  const [tx] = await db
    .select({ valueDate: transactions.valueDate })
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
    })
    .where(eq(transactions.id, transactionId));

  revalidatePath("/bank/transactions");
  return {};
}
