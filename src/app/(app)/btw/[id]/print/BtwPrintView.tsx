"use client";

import { centsToWholeEuros, formatCurrency } from "@/lib/format";

interface BtwPrintViewProps {
  period: {
    periodNumber: number;
    year: number;
    status: string;
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
  companyName: string | null;
}

const RUBRIEKEN = [
  { code: "1a", desc: "Leveringen/diensten belast met hoog tarief (21%)" },
  { code: "1b", desc: "Leveringen/diensten belast met laag tarief (9%)" },
  { code: "1e", desc: "Leveringen/diensten belast met 0% of niet bij u belast" },
  { code: "5b", desc: "Voorbelasting" },
] as const;

export function BtwPrintView({ period: p, btwNumber, companyName }: BtwPrintViewProps) {
  const startMonth = ((p.periodNumber - 1) * 3 + 1).toString().padStart(2, "0");
  const endMonth = (p.periodNumber * 3).toString().padStart(2, "0");
  const lastDay = new Date(p.year, p.periodNumber * 3, 0).getDate();
  const dateRange = `01-${startMonth}-${p.year} t/m ${lastDay}-${endMonth}-${p.year}`;

  const rows: { code: string; desc: string; omzet: string | null; btw: string | null }[] = [
    { code: "1a", desc: RUBRIEKEN[0].desc, omzet: centsToWholeEuros(p.omzetHoogCents), btw: centsToWholeEuros(p.btwHoogCents) },
    { code: "1b", desc: RUBRIEKEN[1].desc, omzet: centsToWholeEuros(p.omzetLaagCents), btw: centsToWholeEuros(p.btwLaagCents) },
    { code: "1e", desc: RUBRIEKEN[2].desc, omzet: centsToWholeEuros(p.omzetNulCents), btw: null },
    { code: "5b", desc: RUBRIEKEN[3].desc, omzet: null, btw: centsToWholeEuros(p.btwInkoopCents) },
  ];

  const filedDate = p.filedAt
    ? new Date(p.filedAt).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl p-8 font-sans text-sm text-gray-900">
      {/* Print button — hidden when printing */}
      <div className="mb-4 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Afdrukken / Opslaan als PDF
        </button>
      </div>

      {/* Header */}
      <div className="mb-6 border-b-2 border-gray-800 pb-4">
        <h1 className="text-xl font-bold">BTW-aangifte Q{p.periodNumber} {p.year}</h1>
        <p className="mt-1 text-gray-600">Aangiftetijdvak: {dateRange}</p>
      </div>

      {/* Company info */}
      <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
        {companyName && (
          <div>
            <span className="font-semibold text-gray-500">Bedrijf:</span>{" "}
            {companyName}
          </div>
        )}
        {btwNumber && (
          <div>
            <span className="font-semibold text-gray-500">BTW-nummer:</span>{" "}
            <span className="font-mono">{btwNumber}</span>
          </div>
        )}
      </div>

      {/* Rubrieken table */}
      <table className="mb-6 w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-300 text-left text-xs font-semibold uppercase text-gray-500">
            <th className="pb-2 pr-4">Rubriek</th>
            <th className="pb-2 pr-4">Omschrijving</th>
            <th className="pb-2 pr-4 text-right">Omzet</th>
            <th className="pb-2 text-right">BTW</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.code} className="border-b border-gray-200">
              <td className="py-2 pr-4 font-mono font-semibold">{row.code}</td>
              <td className="py-2 pr-4">{row.desc}</td>
              <td className="py-2 pr-4 text-right font-mono">
                {row.omzet !== null ? `€ ${row.omzet}` : "—"}
              </td>
              <td className="py-2 text-right font-mono">
                {row.btw !== null ? `€ ${row.btw}` : "—"}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-gray-800 font-bold">
            <td className="py-2 pr-4 font-mono">5g</td>
            <td className="py-2 pr-4">Totaal te betalen / terug te ontvangen</td>
            <td className="py-2 pr-4"></td>
            <td className="py-2 text-right font-mono">
              {formatCurrency(p.btwTeBetalen)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Filing status */}
      {p.status === "filed" && (
        <div className="mb-6 rounded border border-gray-300 bg-gray-50 p-3 text-sm">
          <p>
            <span className="font-semibold">Status:</span> Ingediend
            {filedDate && ` op ${filedDate}`}
          </p>
          {p.confirmationNumber && (
            <p className="mt-1">
              <span className="font-semibold">Betalingskenmerk:</span>{" "}
              <span className="font-mono">{p.confirmationNumber}</span>
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-300 pt-3 text-xs text-gray-400">
        Gegenereerd door Belastingdinst op{" "}
        {new Date().toLocaleDateString("nl-NL", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>
    </div>
  );
}
