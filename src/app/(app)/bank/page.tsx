import { db } from "@/lib/db";
import { bankAccounts, syncLog } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { BankContent } from "@/components/BankContent";

export default async function BankPage() {
  const accounts = await db
    .select()
    .from(bankAccounts)
    .orderBy(desc(bankAccounts.createdAt));

  const recentSyncs = await db
    .select()
    .from(syncLog)
    .orderBy(desc(syncLog.startedAt))
    .limit(10);

  return (
    <BankContent
      accounts={accounts.map((acc) => ({
        id: acc.id,
        displayName: acc.displayName,
        bankName: acc.bankName,
        iban: acc.iban,
        lastSyncedAt: acc.lastSyncedAt
          ? acc.lastSyncedAt.toLocaleDateString("nl-NL")
          : null,
        wiseAccountId: acc.wiseAccountId,
      }))}
      recentSyncs={recentSyncs.map((log) => ({
        id: log.id,
        startedAt: log.startedAt.toLocaleString("nl-NL"),
        source: log.source,
        status: log.status,
        transactionsImported: log.transactionsImported,
      }))}
    />
  );
}
