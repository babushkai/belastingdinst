"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

interface BankAccount {
  id: string;
  displayName: string | null;
  bankName: string | null;
  iban: string;
  lastSyncedAt: string | null;
  pontoAccountId: string | null;
  wiseAccountId: string | null;
}

interface SyncLogEntry {
  id: string;
  startedAt: string;
  source: string;
  status: string;
  transactionsImported: number;
}

export function BankContent({
  accounts,
  recentSyncs,
}: {
  accounts: BankAccount[];
  recentSyncs: SyncLogEntry[];
}) {
  const { t } = useI18n();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">{t("bank")}</h1>
        <div className="flex gap-3">
          <Link
            href="/bank/wise"
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-700 hover:shadow-lg"
          >
            {t("wiseSetup")}
          </Link>
          <Link
            href="/bank/import"
            className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-lg"
          >
            {t("importFile")}
          </Link>
          <Link
            href="/bank/transactions"
            className="inline-flex items-center rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 shadow-sm transition-colors hover:bg-surface-50 hover:text-surface-900"
          >
            {t("allTransactions")}
          </Link>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-surface-800">{t("bankAccounts")}</h2>
      {accounts.length === 0 ? (
        <p className="text-sm text-surface-400">{t("bankAccountsEmpty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {accounts.map((acc) => (
            <div key={acc.id} className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
              <p className="font-medium text-surface-900">
                {acc.displayName ?? acc.bankName ?? t("bankAccount")}
              </p>
              <p className="font-mono text-sm text-surface-500">{acc.iban}</p>
              <p className="mt-2 text-xs text-surface-400">
                {t("lastSync")}{" "}
                {acc.lastSyncedAt ?? t("never")}
              </p>
              {acc.pontoAccountId && (
                <span className="mt-2 inline-block rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                  Ponto
                </span>
              )}
              {acc.wiseAccountId && (
                <span className="mt-2 inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  Wise
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-lg font-semibold text-surface-800">{t("syncLog")}</h2>
      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
              <th className="px-5 py-3">{t("date")}</th>
              <th className="px-5 py-3">{t("source")}</th>
              <th className="px-5 py-3">{t("status")}</th>
              <th className="px-5 py-3">{t("transactions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {recentSyncs.map((log) => (
              <tr key={log.id} className="transition-colors hover:bg-surface-50">
                <td className="px-5 py-3 text-xs text-surface-600">{log.startedAt}</td>
                <td className="px-5 py-3 text-surface-700">{log.source}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      log.status === "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : log.status === "failed"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-surface-700">{log.transactionsImported}</td>
              </tr>
            ))}
            {recentSyncs.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-surface-400">
                  {t("noSyncActivity")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
