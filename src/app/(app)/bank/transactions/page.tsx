import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { TransactionsContent } from "@/components/TransactionsContent";

export default async function TransactionsPage() {
  const allTransactions = await db
    .select({
      id: transactions.id,
      valueDate: transactions.valueDate,
      amountCents: transactions.amountCents,
      counterpartyName: transactions.counterpartyName,
      description: transactions.description,
      importSource: transactions.importSource,
      btwCode: transactions.btwCode,
    })
    .from(transactions)
    .orderBy(desc(transactions.valueDate))
    .limit(100);

  return (
    <TransactionsContent
      transactions={allTransactions.map((tx) => ({
        id: tx.id,
        valueDate: tx.valueDate,
        amountCents: tx.amountCents,
        counterpartyName: tx.counterpartyName,
        description: tx.description,
        importSource: tx.importSource,
      }))}
    />
  );
}
