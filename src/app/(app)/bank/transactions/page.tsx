import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { desc, eq, or, isNull, and, lt, sql } from "drizzle-orm";
import { TransactionsContent } from "@/components/TransactionsContent";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ review?: string }>;
}) {
  const params = await searchParams;
  const reviewMode = params.review === "1";

  const baseQuery = db
    .select({
      id: transactions.id,
      valueDate: transactions.valueDate,
      amountCents: transactions.amountCents,
      counterpartyName: transactions.counterpartyName,
      description: transactions.description,
      importSource: transactions.importSource,
      btwCode: transactions.btwCode,
      btwCodeSource: transactions.btwCodeSource,
      btwCodeSuggested: transactions.btwCodeSuggested,
    })
    .from(transactions);

  const rows = reviewMode
    ? await baseQuery
        .where(
          and(
            lt(transactions.amountCents, 0),
            or(
              isNull(transactions.btwCodeSource),
              eq(transactions.btwCodeSource, "assumed"),
            ),
          ),
        )
        .orderBy(desc(transactions.valueDate))
    : await baseQuery
        .orderBy(desc(transactions.valueDate))
        .limit(200);

  // Count unreviewed for badge
  const [{ count: unreviewedCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactions)
    .where(
      and(
        lt(transactions.amountCents, 0),
        or(
          isNull(transactions.btwCodeSource),
          eq(transactions.btwCodeSource, "assumed"),
        ),
      ),
    );

  return (
    <TransactionsContent
      transactions={rows}
      reviewMode={reviewMode}
      unreviewedCount={unreviewedCount}
    />
  );
}
