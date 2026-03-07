import { db } from "@/lib/db";
import { bankAccounts, syncLog } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";

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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bank</h1>
        <div className="flex gap-3">
          <Link
            href="/bank/import"
            className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Bestand importeren
          </Link>
          <Link
            href="/bank/transactions"
            className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Alle transacties
          </Link>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-medium">Bankrekeningen</h2>
      {accounts.length === 0 ? (
        <p className="text-sm text-gray-400">
          Nog geen bankrekeningen. Importeer een MT940/CAMT bestand om te
          beginnen.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {accounts.map((acc) => (
            <div key={acc.id} className="rounded-lg border p-4">
              <p className="font-medium">
                {acc.displayName ?? acc.bankName ?? "Bankrekening"}
              </p>
              <p className="font-mono text-sm text-gray-500">{acc.iban}</p>
              <p className="mt-2 text-xs text-gray-400">
                Laatste sync:{" "}
                {acc.lastSyncedAt
                  ? acc.lastSyncedAt.toLocaleDateString("nl-NL")
                  : "Nooit"}
              </p>
              {acc.pontoAccountId && (
                <span className="mt-1 inline-block rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                  Ponto
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-lg font-medium">Sync log</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-2">Datum</th>
            <th className="pb-2">Bron</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Transacties</th>
          </tr>
        </thead>
        <tbody>
          {recentSyncs.map((log) => (
            <tr key={log.id} className="border-b">
              <td className="py-2 text-xs">
                {log.startedAt.toLocaleString("nl-NL")}
              </td>
              <td className="py-2">{log.source}</td>
              <td className="py-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    log.status === "success"
                      ? "bg-green-100 text-green-700"
                      : log.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {log.status}
                </span>
              </td>
              <td className="py-2">{log.transactionsImported}</td>
            </tr>
          ))}
          {recentSyncs.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-center text-gray-400">
                Geen sync activiteit.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
