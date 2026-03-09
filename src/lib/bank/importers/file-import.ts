import { db } from "@/lib/db";
import { transactions, syncLog, bankAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseMT940, parseInfo86 } from "../parsers/mt940";
import { parseCAMT053 } from "../parsers/camt053";
import { parseWiseCsv } from "../parsers/wise-csv";
import { inferBtwCode } from "../btw-inference";
import type { ParsedTransaction, ImportResult } from "../types";

export async function importBankFile(
  bankAccountId: string,
  fileBuffer: Buffer,
  filename: string,
): Promise<ImportResult> {
  const content = fileBuffer.toString("utf-8");
  const ext = filename.toLowerCase();

  let parsed: ParsedTransaction[];

  if (ext.endsWith(".sta") || ext.endsWith(".mt940") || ext.endsWith(".swi")) {
    parsed = parseMT940(content);
    // Enrich with :86: info
    for (const tx of parsed) {
      if (tx.description) {
        const info = parseInfo86(tx.description);
        if (info.counterpartyName) tx.counterpartyName = info.counterpartyName;
        if (info.counterpartyIban) tx.counterpartyIban = info.counterpartyIban;
        tx.description = info.description;
      }
    }
  } else if (ext.endsWith(".xml")) {
    parsed = parseCAMT053(content);
  } else if (ext.endsWith(".csv")) {
    parsed = parseWiseCsv(content);
  } else {
    return { imported: 0, skipped: 0, errors: [`Onbekend bestandsformaat: ${ext}`] };
  }

  // Fetch own IBANs for self-transfer detection
  const ownAccounts = await db.select({ iban: bankAccounts.iban }).from(bankAccounts);
  const ownIbans = new Set(ownAccounts.map((a) => a.iban.toUpperCase()));

  // Log sync start
  const [log] = await db
    .insert(syncLog)
    .values({
      bankAccountId,
      source: parsed[0]?.importSource ?? "manual",
    })
    .returning();

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const tx of parsed) {
    try {
      const inferred = inferBtwCode(tx, ownIbans);
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
          importSource: tx.importSource,
          btwCode: inferred.btwCode,
          btwCodeSource: inferred.btwCodeSource,
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
