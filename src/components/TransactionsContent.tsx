"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/format";
import { categoriseTransaction } from "@/lib/bank/actions";

interface Transaction {
  id: string;
  valueDate: string;
  amountCents: number;
  counterpartyName: string | null;
  description: string | null;
  importSource: string;
  btwCode: string | null;
  invoiceId: string | null;
  suggestedBtwCode: string | null;
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

      <div className="overflow-x-auto border border-black bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black bg-white text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              <th className="px-5 py-3">{t("date")}</th>
              <th className="px-5 py-3">{t("description")}</th>
              <th className="px-5 py-3">{t("counterparty")}</th>
              <th className="px-5 py-3 text-right">{t("amount")}</th>
              <th className="px-5 py-3">{t("btwPercent")}</th>
              <th className="px-5 py-3">{t("source")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
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

function TransactionRow({ tx }: { tx: Transaction }) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [optimisticBtw, setOptimisticBtw] = useOptimistic(tx.btwCode);

  function handleChange(value: string) {
    const btwCode = value === "" ? null : value;
    startTransition(async () => {
      setOptimisticBtw(btwCode);
      await categoriseTransaction(tx.id, { btwCode });
    });
  }

  function applySuggestion() {
    if (tx.suggestedBtwCode) {
      handleChange(tx.suggestedBtwCode);
    }
  }

  return (
    <tr className={`hover:bg-gray-50 ${isPending ? "opacity-60" : ""}`}>
      <td className="whitespace-nowrap px-5 py-3 text-sm text-gray-600">
        {formatDate(tx.valueDate)}
      </td>
      <td className="max-w-xs truncate px-5 py-3 text-black">
        {tx.description}
        {tx.invoiceId && (
          <Link
            href={`/invoices/${tx.invoiceId}`}
            className="ml-2 text-xs text-[#0000cc]"
          >
            [{t("invoiceNumber")}]
          </Link>
        )}
      </td>
      <td className="px-5 py-3 text-black">{tx.counterpartyName ?? "-"}</td>
      <td
        className={`whitespace-nowrap px-5 py-3 text-right font-mono font-medium ${
          tx.amountCents < 0 ? "text-red-600" : "text-green-700"
        }`}
      >
        {formatCurrency(tx.amountCents)}
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-1">
          <select
            value={optimisticBtw ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            className="border border-black px-1.5 py-1 text-xs focus:outline focus:outline-2 focus:outline-[#0000cc]"
          >
            <option value="">-</option>
            <option value="21">21%</option>
            <option value="9">9%</option>
            <option value="0">0%</option>
          </select>
          {/* Show suggestion badge for uncategorised debit transactions */}
          {!optimisticBtw && tx.suggestedBtwCode && tx.amountCents < 0 && (
            <button
              type="button"
              onClick={applySuggestion}
              className="text-xs text-gray-400 hover:text-[#0000cc]"
              title={`${t("suggestionLabel")}: ${tx.suggestedBtwCode}%`}
            >
              {tx.suggestedBtwCode}%?
            </button>
          )}
        </div>
      </td>
      <td className="px-5 py-3 text-xs text-gray-500">{tx.importSource}</td>
    </tr>
  );
}
