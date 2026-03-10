"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, centsToWholeEuros, buildCopyAllText } from "@/lib/format";
import { BELASTINGDIENST_OB_URL } from "@/lib/config";

interface BtwFilingCardProps {
  period: {
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
  };
  btwNumber: string | null;
  korActive: boolean;
  onFileClick?: () => void;
}

/** Official Belastingdienst rubrieken — these are regulatory codes, not translated */
const RUBRIEKEN = [
  { code: "1a", desc: "Leveringen/diensten belast met hoog tarief", rate: "21%" },
  { code: "1b", desc: "Leveringen/diensten belast met laag tarief", rate: "9%" },
  { code: "1e", desc: "Leveringen/diensten belast met 0% of niet bij u belast", rate: "0%" },
  { code: "5b", desc: "Voorbelasting", rate: null },
] as const;

function CopyButton({ value, label }: { value: string; label: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Fallback for non-HTTPS contexts
      try {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
      } catch {
        return;
      }
    }
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`${t("copyValue")} ${label}`}
      className="rounded px-1.5 py-0.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
    >
      {copied ? t("copied") : t("copyValue")}
    </button>
  );
}

export function BtwFilingCard({ period, btwNumber, korActive, onFileClick }: BtwFilingCardProps) {
  const { t } = useI18n();
  const p = period;

  const periodLabel = `Q${p.periodNumber} ${p.year}`;
  const startMonth = ((p.periodNumber - 1) * 3 + 1).toString().padStart(2, "0");
  const endMonth = (p.periodNumber * 3).toString().padStart(2, "0");
  const lastDay = new Date(p.year, p.periodNumber * 3, 0).getDate();
  const dateRange = `01-${startMonth}-${p.year} t/m ${lastDay}-${endMonth}-${p.year}`;

  const isKorApplied = korActive && p.btwTeBetalen === 0 && (p.omzetHoogCents + p.omzetLaagCents + p.omzetNulCents) > 0;

  const rows: { code: string; desc: string; omzetCents: number | null; btwCents: number | null }[] = [
    { code: "1a", desc: RUBRIEKEN[0].desc, omzetCents: p.omzetHoogCents, btwCents: p.btwHoogCents },
    { code: "1b", desc: RUBRIEKEN[1].desc, omzetCents: p.omzetLaagCents, btwCents: p.btwLaagCents },
    { code: "1e", desc: RUBRIEKEN[2].desc, omzetCents: p.omzetNulCents, btwCents: null },
    { code: "5b", desc: RUBRIEKEN[3].desc, omzetCents: null, btwCents: p.btwInkoopCents },
  ];

  const filedDate = p.filedAt
    ? new Date(p.filedAt).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between border-b border-surface-100 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-surface-900">
            {t("filingCard")} — {periodLabel}
          </h3>
          <p className="mt-0.5 text-sm text-surface-500">{dateRange}</p>
          {/* Filed status with confirmation number */}
          {p.status === "filed" && filedDate && (
            <p className="mt-1 text-sm text-emerald-600">
              {t("filedOn")} {filedDate}
              {p.confirmationNumber && (
                <span className="ml-2 font-mono text-surface-600">
                  — {t("confirmationNumber")}: {p.confirmationNumber}
                </span>
              )}
            </p>
          )}
        </div>
        <div className="text-right text-sm">
          <div className="text-surface-500">{t("btwNumberLabel")}</div>
          {btwNumber ? (
            <div className="font-mono font-medium text-surface-900">{btwNumber}</div>
          ) : (
            <div className="italic text-surface-400">
              {t("btwNumberMissing")}
            </div>
          )}
        </div>
      </div>

      {/* KOR notice */}
      {isKorApplied && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800">
          {t("korActiveNotice")}
        </div>
      )}

      {/* Action bar: Copy All + Open Portal + Print */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <CopyButton
          value={buildCopyAllText(p)}
          label={t("copyAll")}
        />
        <a
          href={BELASTINGDIENST_OB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
        >
          {t("openPortal")}
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <a
          href={`/btw/${p.id}/print`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded px-2.5 py-1 text-xs font-medium text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700"
        >
          {t("printSummary")}
        </a>
        {/* File button inside the card for unfiled periods */}
        {!p.locked && p.status === "calculated" && onFileClick && (
          <button
            type="button"
            onClick={onFileClick}
            className="ml-auto rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
          >
            {t("submit")}
          </button>
        )}
      </div>

      {/* Rubrieken table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-200 text-left text-xs font-medium uppercase tracking-wider text-surface-400">
            <th className="pb-2 pr-4">Rubriek</th>
            <th className="pb-2 pr-4">Omschrijving</th>
            <th className="pb-2 pr-4 text-right">{t("omzet")}</th>
            <th className="pb-2 pr-4 text-right">{t("btwAmount")}</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-50">
          {rows.map((row) => (
            <tr key={row.code}>
              <td className="py-2.5 pr-4 font-mono text-sm font-semibold text-surface-500">
                {row.code}
              </td>
              <td className="py-2.5 pr-4 text-sm text-surface-600">
                {row.desc}
              </td>
              <td className="py-2.5 pr-4 text-right font-mono text-sm text-surface-700">
                {row.omzetCents !== null ? (
                  <span className="inline-flex items-center gap-1.5">
                    {formatCurrency(row.omzetCents)}
                    <CopyButton
                      value={centsToWholeEuros(row.omzetCents)}
                      label={`${row.code} omzet`}
                    />
                  </span>
                ) : (
                  <span className="text-surface-300">—</span>
                )}
              </td>
              <td className="py-2.5 pr-4 text-right font-mono text-sm text-surface-700">
                {row.btwCents !== null ? (
                  <span className="inline-flex items-center gap-1.5">
                    {formatCurrency(row.btwCents)}
                    <CopyButton
                      value={centsToWholeEuros(row.btwCents)}
                      label={`${row.code} btw`}
                    />
                  </span>
                ) : (
                  <span className="text-surface-300">—</span>
                )}
              </td>
              <td className="py-2.5"></td>
            </tr>
          ))}

          {/* 5g — total, computed by portal */}
          <tr className="border-t border-surface-200">
            <td className="py-2.5 pr-4 font-mono text-sm font-bold text-surface-700">
              5g
            </td>
            <td className="py-2.5 pr-4 text-sm font-semibold text-surface-800">
              Totaal te betalen / terug te ontvangen
            </td>
            <td className="py-2.5 pr-4"></td>
            <td className="py-2.5 pr-4 text-right">
              <span
                className={`font-mono text-sm font-bold ${
                  p.btwTeBetalen >= 0 ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {formatCurrency(p.btwTeBetalen)}
              </span>
            </td>
            <td className="py-2.5 text-xs text-surface-400">
              {t("portalComputes")}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Filing instructions */}
      <div className="mt-4 border-t border-surface-100 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">
          {t("manualFiling")}
        </p>
        <ol className="list-inside list-decimal space-y-1 text-sm text-surface-600">
          <li>{t("filingStep1")}</li>
          <li>{t("filingStep2")}</li>
          <li>{t("filingStep3")}</li>
          <li>{t("filingStep4")}</li>
        </ol>
      </div>
    </div>
  );
}
