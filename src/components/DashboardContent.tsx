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
      <h1 className="mb-6 text-xl font-bold uppercase tracking-widest text-black border-b border-black pb-2">{t("dashboard")}</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Open invoices */}
        <div className="border border-black bg-white p-4">
          <h2 className="text-xs uppercase text-gray-600">{t("openInvoices")}</h2>
          <p className="mt-1 text-3xl font-bold text-black">{data.openCount}</p>
          {data.openTotalCents > 0 && (
            <p className="mt-1 text-sm text-gray-600">
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
        <div className="border border-black bg-white p-4">
          <h2 className="text-xs uppercase text-gray-600">{t("btwPeriod")}</h2>
          <p className="mt-1 text-3xl font-bold text-black">
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
        <div className="border border-black bg-white p-4">
          <h2 className="text-xs uppercase text-gray-600">{t("lastBankSync")}</h2>
          <p className="mt-1 text-lg font-medium text-black">
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
