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
        <LinkButton href="/bank/wise" className="!bg-black hover:!bg-white hover:!text-black !border !border-black">
          {t("wiseSetup")}
        </LinkButton>
        <LinkButton href="/bank/import">{t("importFile")}</LinkButton>
        <LinkButton href="/bank/transactions" variant="secondary">
          {t("allTransactions")}
        </LinkButton>
      </PageHeader>

      <h2 className="mb-3 text-lg font-semibold text-black">{t("bankAccounts")}</h2>
      {accounts.length === 0 ? (
        <p className="text-sm text-gray-500">{t("bankAccountsEmpty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {accounts.map((acc) => (
            <div key={acc.id} className="border border-black bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-black">
                    {acc.displayName ?? acc.bankName ?? t("bankAccount")}
                  </p>
                  <p className="font-mono text-sm text-gray-600">{acc.iban}</p>
                </div>
                {acc.wiseAccountId && <Badge variant="success">Wise</Badge>}
              </div>
              <p className="mt-3 text-xs text-gray-500">
                {t("lastSync")}{" "}
                {acc.lastSyncedAt ? formatDate(acc.lastSyncedAt) : t("never")}
              </p>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-lg font-semibold text-black">{t("syncLog")}</h2>
      <div className="overflow-hidden border border-black bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black bg-white text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              <th className="px-5 py-3">{t("date")}</th>
              <th className="px-5 py-3">{t("source")}</th>
              <th className="px-5 py-3">{t("status")}</th>
              <th className="px-5 py-3">{t("transactions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {recentSyncs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-sm text-gray-600">
                  {formatDate(log.startedAt)}
                </td>
                <td className="px-5 py-3 text-black">{log.source}</td>
                <td className="px-5 py-3">
                  <Badge variant={syncStatusVariant[log.status] ?? "warning"}>
                    {log.status}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-black">{log.transactionsImported}</td>
              </tr>
            ))}
            {recentSyncs.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
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
