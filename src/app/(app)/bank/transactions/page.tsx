import { db } from "@/lib/db";
import { transactions, btwInferenceRules } from "@/lib/db/schema";
import { desc, sql, eq, and, or } from "drizzle-orm";
import { TransactionsContent } from "@/components/TransactionsContent";
import { getDefaultUserId } from "@/lib/auth/helpers";

export default async function TransactionsPage() {
  const userId = await getDefaultUserId();

  const allTransactions = await db
    .select({
      id: transactions.id,
      valueDate: transactions.valueDate,
      amountCents: transactions.amountCents,
      counterpartyName: transactions.counterpartyName,
      description: transactions.description,
      importSource: transactions.importSource,
      btwCode: transactions.btwCode,
      invoiceId: transactions.invoiceId,
      suggestedBtwCode: btwInferenceRules.btwCode,
    })
    .from(transactions)
    .leftJoin(
      btwInferenceRules,
      and(
        eq(btwInferenceRules.userId, userId),
        or(
          eq(transactions.counterpartyIban, btwInferenceRules.counterpartyIban),
          eq(
            sql`lower(regexp_replace(${transactions.counterpartyName}, '[^a-zA-Z0-9]', '', 'g'))`,
            btwInferenceRules.normalizedName,
          ),
        ),
      ),
    )
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
        btwCode: tx.btwCode,
        invoiceId: tx.invoiceId,
        suggestedBtwCode: tx.suggestedBtwCode,
      }))}
    />
  );
}
