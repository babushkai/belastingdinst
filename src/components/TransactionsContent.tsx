"use client";

import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/format";

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
      <PageHeader title={t("transactionsTitle")}>
        <LinkButton href="/bank/import" variant="secondary">
          {t("importButton")}
        </LinkButton>
      </PageHeader>

      <div className="overflow-hidden border border-black bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black bg-white text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              <th className="px-5 py-3">{t("date")}</th>
              <th className="px-5 py-3">{t("description")}</th>
              <th className="px-5 py-3">{t("counterparty")}</th>
              <th className="px-5 py-3 text-right">{t("amount")}</th>
              <th className="px-5 py-3">{t("source")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-5 py-3 text-sm text-gray-600">
                  {formatDate(tx.valueDate)}
                </td>
                <td className="max-w-xs truncate px-5 py-3 text-black">{tx.description}</td>
                <td className="px-5 py-3 text-black">{tx.counterpartyName ?? "-"}</td>
                <td
                  className={`whitespace-nowrap px-5 py-3 text-right font-mono font-medium ${
                    tx.amountCents < 0 ? "text-red-600" : "text-green-700"
                  }`}
                >
                  {formatCurrency(tx.amountCents)}
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">
                  {tx.importSource}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500">
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
