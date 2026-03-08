"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";

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

const statusColors: Record<string, string> = {
  open: "bg-surface-100 text-surface-600",
  calculated: "bg-primary-50 text-primary-700",
  filed: "bg-emerald-50 text-emerald-700",
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
  calculateAction,
  fileAction,
}: {
  periods: BtwPeriod[];
  currentYear: number;
  currentQuarter: number;
  calculateAction: () => Promise<{ error?: string }>;
  fileAction: (periodId: string) => Promise<{ error?: string }>;
}) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-3 font-medium text-red-800 hover:text-red-900">✕</button>
        </div>
      )}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">{t("btwTitle")}</h1>
        <form action={async () => {
          const result = await calculateAction();
          if (result.error) setError(result.error);
          else setError(null);
        }}>
          <button
            type="submit"
            className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-lg"
          >
            {t("calculateQuarter")} Q{currentQuarter} {currentYear}
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
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
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[p.status]}`}
                  >
                    {statusKeyMap[p.status]
                      ? t(statusKeyMap[p.status])
                      : p.status}
                    {p.locked && ` ${t("locked")}`}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-sm text-surface-700">
                  {(p.omzetHoogCents / 100).toFixed(2)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-sm text-surface-700">
                  {(p.omzetLaagCents / 100).toFixed(2)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-sm text-surface-700">
                  {((p.btwHoogCents + p.btwLaagCents) / 100).toFixed(2)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-sm text-surface-700">
                  {(p.btwInkoopCents / 100).toFixed(2)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono font-bold text-surface-900">
                  &euro;{(p.btwTeBetalen / 100).toFixed(2)}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {!p.locked && p.status === "calculated" && (
                    <form
                      className="inline"
                      action={async () => {
                        const result = await fileAction(p.id);
                        if (result.error) setError(result.error);
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
