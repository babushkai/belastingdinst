"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";

interface BtwPeriod {
  id: string;
  periodNumber: number;
  year: number;
  status: string;
  locked: boolean;
  omzetHoogCents: number;
  omzetLaagCents: number;
  btwHoogCents: number;
  btwLaagCents: number;
  btwInkoopCents: number;
  btwTeBetalen: number;
}

const statusVariantMap: Record<string, "default" | "primary" | "success"> = {
  open: "default",
  calculated: "primary",
  filed: "success",
};

const statusKeyMap: Record<string, TranslationKey> = {
  open: "statusOpen",
  calculated: "statusCalculated",
  filed: "statusFiled",
};

export function BtwContent({
  periods,
  currentYear,
  currentQuarter,
  currentPeriodLocked,
  calculateAction,
  fileAction,
}: {
  periods: BtwPeriod[];
  currentYear: number;
  currentQuarter: number;
  currentPeriodLocked: boolean;
  calculateAction: () => Promise<{ error?: string; locked?: true }>;
  fileAction: (periodId: string) => Promise<{ error?: string; locked?: true }>;
}) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-3 font-medium text-red-800 hover:text-red-900">&times;</button>
        </div>
      )}

      <PageHeader title={t("btwTitle")}>
        <div className="flex items-center gap-3">
          {currentPeriodLocked && (
            <Badge variant="success">
              Q{currentQuarter} {currentYear} {t("locked")}
            </Badge>
          )}
          <form action={async () => {
            setCalculating(true);
            const result = await calculateAction();
            if (result.locked) {
              setError(null);
            } else if (result.error) {
              setError(result.error);
            } else {
              setError(null);
            }
            setCalculating(false);
          }}>
            <Button type="submit" loading={calculating} disabled={currentPeriodLocked}>
              {t("calculateQuarter")} Q{currentQuarter} {currentYear}
            </Button>
          </form>
        </div>
      </PageHeader>

      <div className="overflow-x-auto overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
              <th className="px-5 py-3">{t("period")}</th>
              <th className="px-5 py-3">{t("status")}</th>
              <th className="px-5 py-3 text-right">{t("revenue21")}</th>
              <th className="px-5 py-3 text-right">{t("revenue9")}</th>
              <th className="px-5 py-3 text-right">{t("btwPayable")}</th>
              <th className="px-5 py-3 text-right">{t("inputVat")}</th>
              <th className="px-5 py-3 text-right font-bold">{t("toBePaid")}</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {periods.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-surface-50">
                <td className="px-5 py-3.5 font-medium text-surface-900">
                  Q{p.periodNumber} {p.year}
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={statusVariantMap[p.status] ?? "default"}>
                    {statusKeyMap[p.status]
                      ? t(statusKeyMap[p.status])
                      : p.status}
                    {p.locked && ` ${t("locked")}`}
                  </Badge>
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-sm text-surface-700">
                  {formatCurrency(p.omzetHoogCents)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-sm text-surface-700">
                  {formatCurrency(p.omzetLaagCents)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-sm text-surface-700">
                  {formatCurrency(p.btwHoogCents + p.btwLaagCents)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-sm text-surface-700">
                  {formatCurrency(p.btwInkoopCents)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono font-bold text-surface-900">
                  {formatCurrency(p.btwTeBetalen)}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {!p.locked && p.status === "calculated" && (
                    <form
                      className="inline"
                      action={async () => {
                        const result = await fileAction(p.id);
                        if (result.locked) setError(null);
                        else if (result.error) setError(result.error);
                        else setError(null);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {t("submit")}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {periods.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-surface-400">
                  {t("btwEmpty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-primary-100 bg-primary-50/50 p-5 text-sm text-surface-600">
        <p className="font-semibold text-surface-800">{t("manualFiling")}</p>
        <p className="mt-1">{t("manualFilingDescription")}</p>
      </div>
    </div>
  );
}
