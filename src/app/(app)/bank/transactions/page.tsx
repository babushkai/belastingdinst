import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";

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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transacties</h1>
        <Link
          href="/bank/import"
          className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Importeren
        </Link>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-2">Datum</th>
            <th className="pb-2">Omschrijving</th>
            <th className="pb-2">Tegenpartij</th>
            <th className="pb-2 text-right">Bedrag</th>
            <th className="pb-2">Bron</th>
          </tr>
        </thead>
        <tbody>
          {allTransactions.map((tx) => (
            <tr key={tx.id} className="border-b">
              <td className="py-2 font-mono text-xs">{tx.valueDate}</td>
              <td className="py-2 max-w-xs truncate">{tx.description}</td>
              <td className="py-2">{tx.counterpartyName ?? "-"}</td>
              <td
                className={`py-2 text-right font-mono ${
                  tx.amountCents < 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {(tx.amountCents / 100).toFixed(2)}
              </td>
              <td className="py-2 text-xs text-gray-400">
                {tx.importSource}
              </td>
            </tr>
          ))}
          {allTransactions.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-gray-400">
                Nog geen transacties. Importeer een bankbestand.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
