import { db } from "@/lib/db";
import { bankAccounts } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { BankImportForm } from "@/components/BankImportForm";

export default async function BankImportPage() {
  const accounts = await db
    .select({ id: bankAccounts.id, displayName: bankAccounts.displayName, iban: bankAccounts.iban })
    .from(bankAccounts)
    .orderBy(desc(bankAccounts.createdAt));

  return (
    <BankImportForm
      accounts={accounts.map((a) => ({
        id: a.id,
        label: a.displayName ?? a.iban,
      }))}
    />
  );
}
