import { db } from "@/lib/db";
import { bankAccounts, transactions, syncLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStatement, loadWiseToken } from "./client";
import type { WiseTransaction } from "./types";
import type { ParsedTransaction, ImportResult } from "@/lib/bank/types";

function mapWiseTransaction(tx: WiseTransaction): ParsedTransaction {
  const isDebit = tx.type === "DEBIT";
  const amountCents = Math.round(tx.amount.value * 100) * (isDebit ? -1 : 1);

  const counterpartyName = isDebit
    ? tx.details.recipientName
    : tx.details.senderName;

  const counterpartyIban = isDebit
    ? tx.details.recipientAccount
    : tx.details.senderAccount;

  return {
    externalId: tx.referenceNumber,
    valueDate: tx.date.slice(0, 10), // YYYY-MM-DD
    amountCents,
    counterpartyName: counterpartyName ?? undefined,
    counterpartyIban: counterpartyIban ?? undefined,
    description: tx.details.description || tx.details.paymentReference || undefined,
    importSource: "wise",
  };
}

export async function syncWiseAccount(
  bankAccountId: string,
  intervalStart: Date,
  intervalEnd: Date,
): Promise<ImportResult> {
  const apiToken = await loadWiseToken(bankAccountId);
  if (!apiToken) {
    return { imported: 0, skipped: 0, errors: ["Wise API token not configured"] };
  }

  const [account] = await db
    .select({
      wiseProfileId: bankAccounts.wiseProfileId,
      wiseAccountId: bankAccounts.wiseAccountId,
      iban: bankAccounts.iban,
    })
    .from(bankAccounts)
    .where(eq(bankAccounts.id, bankAccountId))
    .limit(1);

  if (!account?.wiseProfileId || !account?.wiseAccountId) {
    return { imported: 0, skipped: 0, errors: ["Wise profile/account not configured"] };
  }

  // Log sync start
  const [log] = await db
    .insert(syncLog)
    .values({ bankAccountId, source: "wise" })
    .returning();

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    // Fetch the EUR currency from IBAN — Wise accounts can hold multi-currency,
    // but for Dutch business accounting we default to EUR
    const currency = "EUR";

    const statement = await getStatement(
      apiToken,
      Number(account.wiseProfileId),
      Number(account.wiseAccountId),
      currency,
      intervalStart,
      intervalEnd,
    );

    const parsed = statement.transactions.map(mapWiseTransaction);

    for (const tx of parsed) {
      try {
        const result = await db
          .insert(transactions)
          .values({
            bankAccountId,
            externalId: tx.externalId,
            valueDate: tx.valueDate,
            executionDate: tx.executionDate ?? null,
            amountCents: tx.amountCents,
            counterpartyName: tx.counterpartyName ?? null,
            counterpartyIban: tx.counterpartyIban ?? null,
            description: tx.description ?? null,
            importSource: "wise",
          })
          .onConflictDoNothing({
            target: [transactions.bankAccountId, transactions.externalId],
          })
          .returning();

        if (result.length > 0) {
          imported++;
        } else {
          skipped++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Transaction ${tx.externalId}: ${msg}`);
      }
    }

    // Update bank account lastSyncedAt
    await db
      .update(bankAccounts)
      .set({ lastSyncedAt: new Date() })
      .where(eq(bankAccounts.id, bankAccountId));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
  }

  // Update sync log
  await db
    .update(syncLog)
    .set({
      finishedAt: new Date(),
      status: errors.length > 0 ? "failed" : "success",
      transactionsImported: imported,
      errorMessage: errors.length > 0 ? errors.join("; ") : null,
    })
    .where(eq(syncLog.id, log.id));

  return { imported, skipped, errors };
}
