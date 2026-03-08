"use client";

import { useI18n } from "@/lib/i18n";

interface DashboardData {
  openCount: number;
  currentBtw: { periodNumber: number; year: number; status: string } | null;
  lastSyncDate: string | null;
}

export function DashboardContent({ data }: { data: DashboardData }) {
  const { t } = useI18n();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-surface-900">{t("dashboard")}</h1>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-surface-500">{t("openInvoices")}</h2>
          <p className="mt-1 text-3xl font-bold text-primary-600">{data.openCount}</p>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-surface-500">{t("btwPeriod")}</h2>
          <p className="mt-1 text-3xl font-bold text-surface-900">
            {data.currentBtw
              ? `Q${data.currentBtw.periodNumber} ${data.currentBtw.year}`
              : t("none")}
          </p>
          <p className="mt-0.5 text-sm text-surface-500">
            {data.currentBtw?.status ?? ""}
          </p>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-surface-500">{t("lastBankSync")}</h2>
          <p className="mt-1 text-sm text-surface-700">
            {data.lastSyncDate ?? t("notSyncedYet")}
          </p>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <a
          href="/invoices/new"
          className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-lg"
        >
          {t("newInvoice")}
        </a>
        <a
          href="/bank/import"
          className="inline-flex items-center rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 shadow-sm transition-colors hover:bg-surface-50 hover:text-surface-900"
        >
          {t("bankImport")}
        </a>
      </div>
    </div>
  );
}
