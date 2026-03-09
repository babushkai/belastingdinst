"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/format";
import { updateTransactionBtwCode } from "@/lib/bank/actions";

interface Transaction {
  id: string;
  valueDate: string;
  amountCents: number;
  counterpartyName: string | null;
  description: string | null;
  importSource: string;
  btwCode: string | null;
  btwCodeSource: string | null;
}

const TABLE_COLS = 6;

function BtwSelect({
  transactionId,
  btwCode,
  btwCodeSource,
}: {
  transactionId: string;
  btwCode: string | null;
  btwCodeSource: string | null;
}) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleChange(value: string) {
    const newCode = value === "" ? null : value;
    setError(null);
    startTransition(async () => {
      const result = await updateTransactionBtwCode(transactionId, newCode);
      if (result.error) {
        setError(result.error);
      }
      router.refresh();
    });
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <select
        value={btwCode ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className={`rounded border px-1.5 py-0.5 text-xs font-medium transition-colors ${
          isPending
            ? "border-surface-200 bg-surface-100 text-surface-400"
            : error
              ? "border-red-300 bg-red-50 text-red-600"
              : "border-surface-200 bg-white text-surface-700 hover:border-surface-300"
        }`}
        title={error ?? undefined}
      >
        <option value="">{t("btwCodeNone")}</option>
        <option value="21">21%</option>
        <option value="9">9%</option>
        <option value="0">0%</option>
      </select>
      {btwCodeSource === "auto" && !error && (
        <span className="text-[10px] italic text-surface-400" title={t("btwCodeAuto")}>
          auto
        </span>
      )}
    </span>
  );
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

      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
              <th className="px-5 py-3">{t("date")}</th>
              <th className="px-5 py-3">{t("description")}</th>
              <th className="px-5 py-3">{t("counterparty")}</th>
              <th className="px-5 py-3 text-right">{t("amount")}</th>
              <th className="px-5 py-3">{t("btw")}</th>
              <th className="px-5 py-3">{t("source")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {transactions.map((tx) => (
              <tr key={tx.id} className="transition-colors hover:bg-surface-50">
                <td className="whitespace-nowrap px-5 py-3 text-sm text-surface-600">
                  {formatDate(tx.valueDate)}
                </td>
                <td className="max-w-xs truncate px-5 py-3 text-surface-700">{tx.description}</td>
                <td className="px-5 py-3 text-surface-700">{tx.counterpartyName ?? "-"}</td>
                <td
                  className={`whitespace-nowrap px-5 py-3 text-right font-mono font-medium ${
                    tx.amountCents < 0 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {formatCurrency(tx.amountCents)}
                </td>
                <td className="px-5 py-3">
                  <BtwSelect
                    transactionId={tx.id}
                    btwCode={tx.btwCode}
                    btwCodeSource={tx.btwCodeSource}
                  />
                </td>
                <td className="px-5 py-3 text-xs text-surface-400">
                  {tx.importSource}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={TABLE_COLS} className="py-12 text-center text-surface-400">
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
