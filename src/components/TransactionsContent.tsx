"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/format";
import { updateTransactionBtwCode, batchUpdateTransactionBtwCode } from "@/lib/bank/actions";

interface Transaction {
  id: string;
  valueDate: string;
  amountCents: number;
  counterpartyName: string | null;
  description: string | null;
  importSource: string;
  btwCode: string | null;
  btwCodeSource: string | null;
  btwCodeSuggested: string | null;
}

const TABLE_COLS = 7;

function SourceBadge({ source, suggested }: { source: string | null; suggested: string | null }) {
  const { t } = useI18n();

  if (source === "auto") {
    return (
      <span className="text-[10px] italic text-surface-400" title={t("btwCodeAuto")}>
        auto
      </span>
    );
  }

  if (source === "learned") {
    return (
      <span
        className="rounded-sm bg-blue-50 px-1 text-[10px] font-medium text-blue-600"
        title={t("btwCodeLearned")}
      >
        {t("btwCodeLearnedShort")}
      </span>
    );
  }

  if (source === "assumed" && suggested) {
    return (
      <span
        className="rounded-sm bg-amber-50 px-1 text-[10px] font-medium text-amber-600"
        title={t("btwCodeAssumedTooltip")}
      >
        ? {suggested}%
      </span>
    );
  }

  return null;
}

function BtwSelect({
  transactionId,
  btwCode,
  btwCodeSource,
  btwCodeSuggested,
}: {
  transactionId: string;
  btwCode: string | null;
  btwCodeSource: string | null;
  btwCodeSuggested: string | null;
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
              : btwCodeSource === "assumed"
                ? "border-amber-200 bg-amber-50 text-surface-700 hover:border-amber-300"
                : "border-surface-200 bg-white text-surface-700 hover:border-surface-300"
        }`}
        title={error ?? undefined}
      >
        <option value="">{t("btwCodeNone")}</option>
        <option value="21">21%</option>
        <option value="9">9%</option>
        <option value="0">0%</option>
      </select>
      <SourceBadge source={btwCodeSource} suggested={btwCodeSuggested} />
    </span>
  );
}

function BatchActionBar({
  selectedIds,
  onClear,
}: {
  selectedIds: Set<string>;
  onClear: () => void;
}) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [batchCode, setBatchCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (selectedIds.size === 0) return null;

  function handleApply() {
    const code = batchCode === "" ? null : batchCode;
    setError(null);
    startTransition(async () => {
      const result = await batchUpdateTransactionBtwCode([...selectedIds], code);
      if (result.error) {
        setError(result.error);
      } else {
        onClear();
      }
      router.refresh();
    });
  }

  return (
    <div className="sticky bottom-0 border-t border-surface-200 bg-white px-5 py-3 shadow-lg">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-surface-700">
          {selectedIds.size} {t("btwBatchSelected")}
        </span>
        <select
          value={batchCode}
          onChange={(e) => setBatchCode(e.target.value)}
          className="rounded border border-surface-200 px-2 py-1 text-sm"
        >
          <option value="">{t("btwCodeNone")}</option>
          <option value="21">21%</option>
          <option value="9">9%</option>
          <option value="0">0%</option>
        </select>
        <button
          onClick={handleApply}
          disabled={isPending}
          className="rounded bg-surface-800 px-3 py-1 text-sm font-medium text-white hover:bg-surface-700 disabled:opacity-50"
        >
          {isPending ? "..." : t("btwBatchApply")}
        </button>
        <button
          onClick={onClear}
          className="text-sm text-surface-400 hover:text-surface-600"
        >
          {t("cancel")}
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}

export function TransactionsContent({
  transactions,
  reviewMode,
  unreviewedCount,
}: {
  transactions: Transaction[];
  reviewMode: boolean;
  unreviewedCount: number;
}) {
  const { t } = useI18n();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((tx) => tx.id)));
    }
  }

  return (
    <div>
      <PageHeader title={t("transactionsTitle")}>
        <div className="flex items-center gap-2">
          {!reviewMode && unreviewedCount > 0 && (
            <LinkButton href="/bank/transactions?review=1" variant="secondary">
              {t("btwReviewLink")} ({unreviewedCount})
            </LinkButton>
          )}
          {reviewMode && (
            <LinkButton href="/bank/transactions" variant="secondary">
              {t("allTransactions")}
            </LinkButton>
          )}
          <LinkButton href="/bank/import" variant="secondary">
            {t("importButton")}
          </LinkButton>
        </div>
      </PageHeader>

      {reviewMode && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("btwReviewBanner").replace("{count}", String(transactions.length))}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={transactions.length > 0 && selectedIds.size === transactions.length}
                  onChange={toggleSelectAll}
                  className="rounded border-surface-300"
                />
              </th>
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
              <tr
                key={tx.id}
                className={`transition-colors hover:bg-surface-50 ${
                  selectedIds.has(tx.id) ? "bg-blue-50/50" : ""
                }`}
              >
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(tx.id)}
                    onChange={() => toggleSelect(tx.id)}
                    className="rounded border-surface-300"
                  />
                </td>
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
                    btwCodeSuggested={tx.btwCodeSuggested}
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
                  {reviewMode ? t("btwReviewEmpty") : t("transactionsEmpty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <BatchActionBar
          selectedIds={selectedIds}
          onClear={() => setSelectedIds(new Set())}
        />
      </div>
    </div>
  );
}
