"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";

interface Invoice {
  id: string;
  invoiceNumber: string;
  companyName: string | null;
  issueDate: string;
  dueDate: string | null;
  status: string;
}

const statusColorMap: Record<string, string> = {
  draft: "bg-surface-100 text-surface-600",
  sent: "bg-primary-50 text-primary-700",
  paid: "bg-emerald-50 text-emerald-700",
  overdue: "bg-red-50 text-red-700",
  void: "bg-surface-100 text-surface-400",
};

const statusKeyMap: Record<string, TranslationKey> = {
  draft: "statusDraft",
  sent: "statusSent",
  paid: "statusPaid",
  overdue: "statusOverdue",
  void: "statusVoid",
};

export function InvoicesContent({ invoices }: { invoices: Invoice[] }) {
  const { t } = useI18n();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">{t("invoices")}</h1>
        <Link
          href="/invoices/new"
          className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-lg"
        >
          {t("newInvoice")}
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
              <th className="px-5 py-3">{t("invoiceNumber")}</th>
              <th className="px-5 py-3">{t("customer")}</th>
              <th className="px-5 py-3">{t("date")}</th>
              <th className="px-5 py-3">{t("dueDate")}</th>
              <th className="px-5 py-3">{t("status")}</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="transition-colors hover:bg-surface-50">
                <td className="px-5 py-3.5 font-mono text-sm text-surface-900">{inv.invoiceNumber}</td>
                <td className="px-5 py-3.5 font-medium text-surface-700">{inv.companyName}</td>
                <td className="px-5 py-3.5 text-sm text-surface-600">{inv.issueDate}</td>
                <td className="px-5 py-3.5 text-sm text-surface-600">{inv.dueDate ?? "-"}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColorMap[inv.status] ?? ""}`}
                  >
                    {statusKeyMap[inv.status]
                      ? t(statusKeyMap[inv.status])
                      : inv.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {t("view")}
                  </Link>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-surface-400">
                  {t("invoicesEmpty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
