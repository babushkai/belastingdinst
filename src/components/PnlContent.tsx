"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatCurrency } from "@/lib/format";
import { APP_FIRST_YEAR } from "@/lib/config";
import type { PnlResult } from "@/lib/reports/pnl";

export function PnlContent({ year, pnl }: { year: number; pnl: PnlResult }) {
  const { t } = useI18n();
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - APP_FIRST_YEAR + 1 },
    (_, i) => currentYear - i,
  );

  return (
    <div>
      <PageHeader title={t("pnlTitle")}>
        <select
          value={year}
          onChange={(e) => router.push(`/reports/pnl?year=${e.target.value}`)}
          className="border border-black px-2 py-2 text-sm focus:outline focus:outline-2 focus:outline-[#0000cc]"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </PageHeader>

      {/* Warning for uncategorised expenses */}
      {pnl.uncategorisedExpenseCount > 0 && (
        <div className="mb-4 border border-amber-700 bg-white p-3 text-sm text-amber-700">
          {pnl.uncategorisedExpenseCount} {t("uncategorisedWarning")}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border border-black bg-white p-5">
          <p className="text-xs uppercase text-gray-500">{t("revenueExVat")}</p>
          <p className="mt-1 text-2xl font-bold text-black">
            {formatCurrency(pnl.revenueExVatCents)}
          </p>
        </div>
        <div className="border border-black bg-white p-5">
          <p className="text-xs uppercase text-gray-500">{t("expensesExVat")}</p>
          <p className="mt-1 text-2xl font-bold text-black">
            {formatCurrency(pnl.expensesExVatCents)}
          </p>
        </div>
        <div className="border border-black bg-white p-5">
          <p className="text-xs uppercase text-gray-500">{t("grossProfit")}</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              pnl.grossProfitCents >= 0 ? "text-green-700" : "text-red-600"
            }`}
          >
            {formatCurrency(pnl.grossProfitCents)}
          </p>
        </div>
      </div>

      {/* Quarterly breakdown */}
      <div className="mt-6 border border-black bg-white">
        <h2 className="border-b border-black px-5 py-3 text-sm font-semibold uppercase text-black">
          {t("quarterlyBreakdown")}
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black text-left text-xs uppercase text-gray-500">
              <th className="px-5 py-3">{t("period")}</th>
              <th className="px-5 py-3 text-right">{t("revenueExVat")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {pnl.revenueByQuarter.map((q) => (
              <tr key={q.quarter} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-black">Q{q.quarter} {year}</td>
                <td className="px-5 py-3 text-right font-mono text-black">
                  {formatCurrency(q.cents)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-black font-bold">
              <td className="px-5 py-3 text-black">{t("total")}</td>
              <td className="px-5 py-3 text-right font-mono text-black">
                {formatCurrency(pnl.revenueExVatCents)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
