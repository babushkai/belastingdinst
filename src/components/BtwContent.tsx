"use client";

import { Fragment, useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { PeriodSelector } from "@/components/ui/PeriodSelector";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BtwFilingCard } from "@/components/BtwFilingCard";
import { formatCurrency } from "@/lib/format";

export interface BtwPeriod {
  id: string;
  periodNumber: number;
  year: number;
  status: string;
  locked: boolean;
  omzetHoogCents: number;
  omzetLaagCents: number;
  omzetNulCents: number;
  btwHoogCents: number;
  btwLaagCents: number;
  btwInkoopCents: number;
  btwTeBetalen: number;
  confirmationNumber: string | null;
  filedAt: string | null;
}

const TABLE_COLS = 8;

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

interface BtwContentProps {
  periods: BtwPeriod[];
  currentYear: number;
  currentQuarter: number;
  firstYear: number;
  lockedPeriodKeys: string[];
  btwNumber: string | null;
  korActive: boolean;
  calculateAction: (
    formData: FormData,
  ) => Promise<{ error?: string; locked?: true }>;
  fileAction: (
    periodId: string,
    confirmationNumber?: string,
  ) => Promise<{ error?: string; locked?: true }>;
}

export function BtwContent({
  periods,
  currentYear,
  currentQuarter,
  firstYear,
  lockedPeriodKeys,
  btwNumber,
  korActive,
  calculateAction,
  fileAction,
}: BtwContentProps) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  // Confirmation modal state
  const [confirmingPeriodId, setConfirmingPeriodId] = useState<string | null>(null);
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [filing, setFiling] = useState(false);

  const lockedSet = useMemo(() => new Set(lockedPeriodKeys), [lockedPeriodKeys]);

  const isSelectedLocked = lockedSet.has(`${selectedYear}-${selectedQuarter}`);
  const isFutureQuarter =
    selectedYear > currentYear ||
    (selectedYear === currentYear && selectedQuarter > currentQuarter);

  const years = useMemo(() => {
    const result: number[] = [];
    for (let y = currentYear; y >= firstYear; y--) {
      result.push(y);
    }
    return result;
  }, [currentYear, firstYear]);

  const availableQuarters = useMemo(() => {
    if (selectedYear === currentYear) {
      return [1, 2, 3, 4].filter((q) => q <= currentQuarter);
    }
    return [1, 2, 3, 4];
  }, [selectedYear, currentYear, currentQuarter]);

  function handleYearChange(year: number) {
    setSelectedYear(year);
    if (year === currentYear && selectedQuarter > currentQuarter) {
      setSelectedQuarter(currentQuarter);
    }
  }

  async function handleConfirmFiling() {
    if (!confirmingPeriodId) return;
    setFiling(true);
    setError(null);
    const result = await fileAction(confirmingPeriodId, confirmationNumber || undefined);
    setFiling(false);
    if (result.error) {
      setError(result.error);
    } else if (result.locked) {
      setError("Deze periode is al vergrendeld.");
    } else {
      setConfirmingPeriodId(null);
      setConfirmationNumber("");
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 border border-red-700 bg-white p-3 text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-3 font-medium text-red-800 hover:text-red-900"
          >
            &times;
          </button>
        </div>
      )}

      <PageHeader title={t("btwTitle")} />

      <div className="mb-6 flex items-center justify-between">
        <PeriodSelector
          years={years}
          selectedYear={selectedYear}
          selectedQuarter={selectedQuarter}
          availableQuarters={availableQuarters}
          lockedKeys={lockedSet}
          onYearChange={handleYearChange}
          onQuarterChange={setSelectedQuarter}
        />

        <div className="flex items-center gap-3">
          {isSelectedLocked && (
            <span className="text-sm text-green-700">
              Q{selectedQuarter} {selectedYear} {t("locked")}
            </span>
          )}
          <form
            action={async (formData: FormData) => {
              setCalculating(true);
              setError(null);
              const result = await calculateAction(formData);
              if (result.error) {
                setError(result.error);
              }
              setCalculating(false);
            }}
          >
            <input type="hidden" name="year" value={selectedYear} />
            <input type="hidden" name="quarter" value={selectedQuarter} />
            <Button
              type="submit"
              loading={calculating}
              disabled={isSelectedLocked || isFutureQuarter}
            >
              {t("calculate")} Q{selectedQuarter} {selectedYear}
            </Button>
          </form>
        </div>
      </div>

      <div className="overflow-x-auto border border-black bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black bg-white text-left text-xs font-medium uppercase tracking-wider text-gray-600">
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
          <tbody className="divide-y divide-gray-300">
            {periods.map((p) => {
              const isExpanded = expandedId === p.id;
              const canExpand = p.status === "calculated" || p.status === "filed";

              return (
                <Fragment key={p.id}>
                  <tr
                    onClick={canExpand ? () => setExpandedId(isExpanded ? null : p.id) : undefined}
                    className={`hover:bg-gray-50 ${canExpand ? "cursor-pointer" : ""} ${isExpanded ? "bg-gray-50" : ""}`}
                  >
                    <td className="px-5 py-3.5 font-medium text-black">
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
                    <td className="px-5 py-3.5 text-right font-mono text-sm text-black">
                      {formatCurrency(p.omzetHoogCents)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-sm text-black">
                      {formatCurrency(p.omzetLaagCents)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-sm text-black">
                      {formatCurrency(p.btwHoogCents + p.btwLaagCents)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-sm text-black">
                      {formatCurrency(p.btwInkoopCents)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-black">
                      {formatCurrency(p.btwTeBetalen)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {!p.locked && p.status === "calculated" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmingPeriodId(p.id);
                          }}
                          className="text-sm font-medium text-[#0000cc] hover:text-[#000099]"
                        >
                          {t("submit")}
                        </button>
                      )}
                      {canExpand && (
                        <span className="ml-2 text-xs text-gray-500">
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${p.id}-card`}>
                      <td colSpan={TABLE_COLS} className="border-none bg-gray-50 p-0">
                        <div className="px-5 py-4">
                          <BtwFilingCard
                            period={p}
                            btwNumber={btwNumber}
                            korActive={korActive}
                            onFileClick={() => setConfirmingPeriodId(p.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {periods.length === 0 && (
              <tr>
                <td colSpan={TABLE_COLS} className="py-12 text-center text-gray-500">
                  {t("btwEmpty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 border border-black bg-white p-5 text-sm text-gray-600">
        <p className="font-semibold text-black">{t("manualFiling")}</p>
        <p className="mt-1">{t("manualFilingDescription")}</p>
      </div>

      {/* Confirmation modal */}
      {confirmingPeriodId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => {
            if (!filing) {
              setConfirmingPeriodId(null);
              setConfirmationNumber("");
            }
          }}
        >
          <div
            className="w-full max-w-md border border-black bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-black">
              {t("filingConfirmTitle")}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {t("filingConfirmDescription")}
            </p>

            <div className="mt-4">
              <label
                htmlFor="confirmation-number"
                className="block text-sm font-medium text-black"
              >
                {t("confirmationNumber")}
              </label>
              <input
                id="confirmation-number"
                type="text"
                value={confirmationNumber}
                onChange={(e) => setConfirmationNumber(e.target.value)}
                placeholder={t("confirmationNumberPlaceholder")}
                className="mt-1 w-full border border-black px-2 py-1.5 text-sm focus:outline focus:outline-2 focus:outline-[#0000cc]"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmingPeriodId(null);
                  setConfirmationNumber("");
                }}
                disabled={filing}
                className="border border-black px-4 py-2 text-sm font-medium text-black hover:bg-gray-100 disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmFiling}
                disabled={filing}
                className="border border-black bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black disabled:opacity-50"
              >
                {filing ? "..." : t("confirmAndLock")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
