import { db } from "@/lib/db";
import { bankAccounts } from "@/lib/db/schema";
import { isNotNull } from "drizzle-orm";
import { GoCardlessContent } from "@/components/GoCardlessContent";

export default async function GoCardlessPage() {
  const connectedAccounts = await db
    .select({
      id: bankAccounts.id,
      iban: bankAccounts.iban,
      bankName: bankAccounts.bankName,
      displayName: bankAccounts.displayName,
      lastSyncedAt: bankAccounts.lastSyncedAt,
      gcRefreshTokenExpiresAt: bankAccounts.gcRefreshTokenExpiresAt,
    })
    .from(bankAccounts)
    .where(isNotNull(bankAccounts.gcAccountId));

  return (
    <GoCardlessContent
      accounts={connectedAccounts.map((acc) => ({
        id: acc.id,
        iban: acc.iban,
        bankName: acc.bankName,
        displayName: acc.displayName,
        lastSyncedAt: acc.lastSyncedAt?.toISOString() ?? null,
        gcRefreshTokenExpiresAt:
          acc.gcRefreshTokenExpiresAt?.toISOString() ?? null,
      }))}
    />
  );
}
