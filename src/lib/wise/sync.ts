"use server";

import { db } from "@/lib/db";
import { bankAccounts, transactions, syncLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStatementMT940, loadWiseToken } from "./client";
import { parseMT940, parseInfo86 } from "@/lib/bank/parsers/mt940";
import type { ImportResult } from "@/lib/bank/types";

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
    // Download MT940 statement from Wise API
    const mt940Content = await getStatementMT940(
      apiToken,
      Number(account.wiseProfileId),
      Number(account.wiseAccountId),
      "EUR",
      intervalStart,
      intervalEnd,
    );

    // Parse through existing MT940 parser
    const parsed = parseMT940(mt940Content);

    // Enrich with :86: info (same as file-import pipeline)
    for (const tx of parsed) {
      if (tx.description) {
        const info = parseInfo86(tx.description);
        if (info.counterpartyName) tx.counterpartyName = info.counterpartyName;
        if (info.counterpartyIban) tx.counterpartyIban = info.counterpartyIban;
        tx.description = info.description;
      }
      // Override import source since this came from Wise API
      tx.importSource = "wise";
    }

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

    // Update last synced
    await db
      .update(bankAccounts)
      .set({ lastSyncedAt: new Date() })
      .where(eq(bankAccounts.id, bankAccountId));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
  }

  // Update sync log — always runs
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
