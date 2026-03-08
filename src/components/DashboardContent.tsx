"use client";

import { useI18n } from "@/lib/i18n";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatRelativeDate } from "@/lib/format";
import type { TranslationKey } from "@/lib/i18n";

interface DashboardData {
  openCount: number;
  openTotalCents: number;
  currentBtw: { periodNumber: number; year: number; status: string } | null;
  lastSyncDate: string | null;
}

const btwStatusVariant: Record<string, "default" | "primary" | "success"> = {
  open: "default",
  calculated: "primary",
  filed: "success",
};

const btwStatusKey: Record<string, TranslationKey> = {
  open: "statusOpen",
  calculated: "statusCalculated",
  filed: "statusFiled",
};

export function DashboardContent({ data }: { data: DashboardData }) {
  const { t } = useI18n();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-surface-900">{t("dashboard")}</h1>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Open invoices */}
        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-surface-500">{t("openInvoices")}</h2>
          <p className="mt-1 text-3xl font-bold text-primary-600">{data.openCount}</p>
          {data.openTotalCents > 0 && (
            <p className="mt-1 text-sm font-medium text-surface-500">
              {formatCurrency(data.openTotalCents)}
            </p>
          )}
          <div className="mt-4">
            <LinkButton href="/invoices/new" size="sm">
              {t("newInvoice")}
            </LinkButton>
          </div>
        </div>

        {/* BTW period */}
        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-surface-500">{t("btwPeriod")}</h2>
          <p className="mt-1 text-3xl font-bold text-surface-900">
            {data.currentBtw
              ? `Q${data.currentBtw.periodNumber} ${data.currentBtw.year}`
              : t("none")}
          </p>
          {data.currentBtw && (
            <div className="mt-1">
              <Badge variant={btwStatusVariant[data.currentBtw.status] ?? "default"}>
                {btwStatusKey[data.currentBtw.status]
                  ? t(btwStatusKey[data.currentBtw.status])
                  : data.currentBtw.status}
              </Badge>
            </div>
          )}
          <div className="mt-4">
            <LinkButton href="/btw" variant="secondary" size="sm">
              {t("btwTitle")}
            </LinkButton>
          </div>
        </div>

        {/* Last sync */}
        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-surface-500">{t("lastBankSync")}</h2>
          <p className="mt-1 text-lg font-medium text-surface-700">
            {data.lastSyncDate ? formatRelativeDate(data.lastSyncDate) : t("notSyncedYet")}
          </p>
          <div className="mt-4">
            <LinkButton href="/bank/import" variant="secondary" size="sm">
              {t("bankImport")}
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}
