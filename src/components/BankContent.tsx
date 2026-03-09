"use client";

import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";

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

const syncStatusVariant: Record<string, "success" | "danger" | "warning"> = {
  success: "success",
  failed: "danger",
};

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
      <PageHeader title={t("bank")}>
        <LinkButton href="/bank/wise" className="!bg-emerald-600 !shadow-emerald-600/25 hover:!bg-emerald-700">
          {t("wiseSetup")}
        </LinkButton>
        <LinkButton href="/bank/import">{t("importFile")}</LinkButton>
        <LinkButton href="/bank/transactions" variant="secondary">
          {t("allTransactions")}
        </LinkButton>
      </PageHeader>

      <h2 className="mb-3 text-lg font-semibold text-surface-800">{t("bankAccounts")}</h2>
      {accounts.length === 0 ? (
        <p className="text-sm text-surface-400">{t("bankAccountsEmpty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {accounts.map((acc) => (
            <div key={acc.id} className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-surface-900">
                    {acc.displayName ?? acc.bankName ?? t("bankAccount")}
                  </p>
                  <p className="font-mono text-sm text-surface-500">{acc.iban}</p>
                </div>
                {acc.pontoAccountId && <Badge variant="primary">Ponto</Badge>}
                {acc.wiseAccountId && <Badge variant="success">Wise</Badge>}
              </div>
              <p className="mt-3 text-xs text-surface-400">
                {t("lastSync")}{" "}
                {acc.lastSyncedAt ? formatDate(acc.lastSyncedAt) : t("never")}
              </p>
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
                <td className="px-5 py-3 text-sm text-surface-600">
                  {formatDate(log.startedAt)}
                </td>
                <td className="px-5 py-3 text-surface-700">{log.source}</td>
                <td className="px-5 py-3">
                  <Badge variant={syncStatusVariant[log.status] ?? "warning"}>
                    {log.status}
                  </Badge>
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
