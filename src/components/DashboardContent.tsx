"use client";

import { useI18n } from "@/lib/i18n";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatRelativeDate, formatDate } from "@/lib/format";
import type { TranslationKey } from "@/lib/i18n";

interface TaxDeadline {
  label: string;
  dueDate: string;
  type: "btw" | "ib";
  urgent: boolean;
  overdue: boolean;
}

interface DashboardData {
  openCount: number;
  openTotalCents: number;
  overdueCount: number;
  overdueTotalCents: number;
  currentBtw: { periodNumber: number; year: number; status: string } | null;
  lastSyncDate: string | null;
  deadlines: TaxDeadline[];
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

      {/* Overdue invoices alert */}
      {data.overdueCount > 0 && (
        <div className="mt-4 border border-red-700 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs uppercase text-red-700">{t("overdueInvoices")}</h2>
              <p className="mt-1 text-2xl font-bold text-red-700">
                {data.overdueCount} — {formatCurrency(data.overdueTotalCents)}
              </p>
            </div>
            <LinkButton href="/invoices" variant="danger" size="sm">
              {t("view")}
            </LinkButton>
          </div>
        </div>
      )}

      {/* Tax deadlines */}
      {data.deadlines.length > 0 && (
        <div className="mt-6 border border-black bg-white">
          <h2 className="border-b border-black px-5 py-3 text-xs font-semibold uppercase text-black">
            {t("taxDeadlines")}
          </h2>
          <div className="divide-y divide-gray-300">
            {data.deadlines.map((d) => (
              <div key={d.label} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block h-2.5 w-2.5 border ${
                      d.overdue
                        ? "border-red-700 bg-red-700"
                        : d.urgent
                          ? "border-amber-700 bg-amber-700"
                          : "border-green-700 bg-green-700"
                    }`}
                  />
                  <span className="text-sm text-black">{d.label}</span>
                </div>
                <span className="text-sm font-mono text-gray-600">
                  {formatDate(d.dueDate)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
