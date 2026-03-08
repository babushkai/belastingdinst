import { db } from "@/lib/db";
import { bankAccounts } from "@/lib/db/schema";
import { desc, isNotNull } from "drizzle-orm";
import { WiseSetupContent } from "@/components/WiseSetupContent";

export default async function WiseSetupPage() {
  const connected = await db
    .select({
      id: bankAccounts.id,
      displayName: bankAccounts.displayName,
      bankName: bankAccounts.bankName,
      iban: bankAccounts.iban,
    })
    .from(bankAccounts)
    .where(isNotNull(bankAccounts.wiseAccountId))
    .orderBy(desc(bankAccounts.createdAt));

  return (
    <WiseSetupContent
      connectedAccounts={connected.map((acc) => ({
        id: acc.id,
        label: acc.displayName ?? acc.bankName ?? acc.iban,
      }))}
    />
  );
}
