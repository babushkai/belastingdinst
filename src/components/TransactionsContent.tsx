"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

interface Transaction {
  id: string;
  valueDate: string;
  amountCents: number;
  counterpartyName: string | null;
  description: string | null;
  importSource: string;
}

export function TransactionsContent({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const { t } = useI18n();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">{t("transactionsTitle")}</h1>
        <Link
          href="/bank/import"
          className="inline-flex items-center rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 shadow-sm transition-colors hover:bg-surface-50 hover:text-surface-900"
        >
          {t("importButton")}
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
              <th className="px-5 py-3">{t("date")}</th>
              <th className="px-5 py-3">{t("description")}</th>
              <th className="px-5 py-3">{t("counterparty")}</th>
              <th className="px-5 py-3 text-right">{t("amount")}</th>
              <th className="px-5 py-3">{t("source")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {transactions.map((tx) => (
              <tr key={tx.id} className="transition-colors hover:bg-surface-50">
                <td className="px-5 py-3 font-mono text-xs text-surface-600">{tx.valueDate}</td>
                <td className="max-w-xs truncate px-5 py-3 text-surface-700">{tx.description}</td>
                <td className="px-5 py-3 text-surface-700">{tx.counterpartyName ?? "-"}</td>
                <td
                  className={`px-5 py-3 text-right font-mono font-medium ${
                    tx.amountCents < 0 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {(tx.amountCents / 100).toFixed(2)}
                </td>
                <td className="px-5 py-3 text-xs text-surface-400">
                  {tx.importSource}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-surface-400">
                  {t("transactionsEmpty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
