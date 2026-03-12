import { db } from "@/lib/db";
import { transactions, syncLog, bankAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getValidAccessToken } from "./token-manager";
import { getTransactions, type GcTransaction } from "./client";
import type { ImportResult } from "../types";
import { createHash } from "crypto";

/**
 * Convert a decimal amount string to integer cents without floating-point loss.
 * Handles: "12.50" → 1250, "-0.01" → -1, "1000" → 100000
 */
export function amountToCents(amountStr: string): number {
  const negative = amountStr.startsWith("-");
  const abs = negative ? amountStr.slice(1) : amountStr;
  const [whole, frac = ""] = abs.split(".");
  const paddedFrac = (frac + "00").slice(0, 2);
  const cents = parseInt(whole, 10) * 100 + parseInt(paddedFrac, 10);
  return negative ? -cents : cents;
}

/** Build a deterministic external ID for deduplication. */
export function buildExternalId(
  gcAccountId: string,
  tx: GcTransaction,
): string {
  if (tx.transactionId) {
    return `gc-${tx.transactionId}`;
  }
  // Fallback composite key when bank doesn't provide transactionId
  const hash = createHash("sha256")
    .update(
      [
        gcAccountId,
        tx.bookingDate,
        tx.transactionAmount.amount,
        tx.creditorName ?? tx.debtorName ?? "",
        tx.remittanceInformationUnstructured ?? "",
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 16);
  return `gc-${tx.bookingDate}-${hash}`;
}

function getDescription(tx: GcTransaction): string | null {
  if (tx.remittanceInformationUnstructured) {
    return tx.remittanceInformationUnstructured;
  }
  if (tx.remittanceInformationUnstructuredArray?.length) {
    return tx.remittanceInformationUnstructuredArray.join(" ");
  }
  return null;
}

function getCounterparty(tx: GcTransaction) {
  // For credits (incoming), the counterparty is the debtor
  // For debits (outgoing), the counterparty is the creditor
  const isCredit = !tx.transactionAmount.amount.startsWith("-");
  if (isCredit) {
    return {
      name: tx.debtorName ?? tx.creditorName ?? null,
      iban: tx.debtorAccount?.iban ?? tx.creditorAccount?.iban ?? null,
    };
  }
  return {
    name: tx.creditorName ?? tx.debtorName ?? null,
    iban: tx.creditorAccount?.iban ?? tx.debtorAccount?.iban ?? null,
  };
}

export async function syncGoCardlessAccount(
  bankAccountId: string,
): Promise<ImportResult> {
  const [account] = await db
    .select({
      gcAccountId: bankAccounts.gcAccountId,
      lastSyncedAt: bankAccounts.lastSyncedAt,
    })
    .from(bankAccounts)
    .where(eq(bankAccounts.id, bankAccountId))
    .limit(1);

  if (!account?.gcAccountId) {
    return { imported: 0, skipped: 0, errors: ["Account niet gekoppeld aan GoCardless"] };
  }

  // Determine date_from: lastSync - 1 day buffer, or 90 days back
  let dateFrom: string;
  if (account.lastSyncedAt) {
    const buffer = new Date(account.lastSyncedAt);
    buffer.setDate(buffer.getDate() - 1);
    dateFrom = buffer.toISOString().split("T")[0];
  } else {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    dateFrom = ninetyDaysAgo.toISOString().split("T")[0];
  }

  // Log sync start
  const [log] = await db
    .insert(syncLog)
    .values({ bankAccountId, source: "gocardless" })
    .returning();

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    const accessToken = await getValidAccessToken(bankAccountId);
    // GoCardless free tier caps history at 90 days; some banks offer more
    const { booked } = await getTransactions(
      account.gcAccountId,
      dateFrom,
      accessToken,
    );

    for (const gcTx of booked) {
      const counterparty = getCounterparty(gcTx);
      const externalId = buildExternalId(account.gcAccountId, gcTx);

      try {
        const result = await db
          .insert(transactions)
          .values({
            bankAccountId,
            externalId,
            valueDate: gcTx.valueDate ?? gcTx.bookingDate,
            executionDate: gcTx.bookingDate,
            amountCents: amountToCents(gcTx.transactionAmount.amount),
            counterpartyName: counterparty.name,
            counterpartyIban: counterparty.iban,
            description: getDescription(gcTx),
            importSource: "gocardless",
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
        errors.push(`Transaction ${externalId}: ${msg}`);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
  }

  // Update sync log — always runs, even on token/network failure
  await db
    .update(syncLog)
    .set({
      finishedAt: new Date(),
      status: errors.length > 0 ? "failed" : "success",
      transactionsImported: imported,
      errorMessage: errors.length > 0 ? errors.join("; ") : null,
    })
    .where(eq(syncLog.id, log.id));

  if (errors.length === 0) {
    await db
      .update(bankAccounts)
      .set({ lastSyncedAt: new Date() })
      .where(eq(bankAccounts.id, bankAccountId));
  }

  return { imported, skipped, errors };
}
