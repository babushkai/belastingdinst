"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";

interface Invoice {
  id: string;
  invoiceNumber: string;
  companyName: string | null;
  issueDate: string;
  dueDate: string | null;
  status: string;
  totalCents: number | null;
}

const statusVariantMap: Record<string, "default" | "primary" | "success" | "danger"> = {
  draft: "default",
  sent: "primary",
  paid: "success",
  overdue: "danger",
  void: "default",
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
      <PageHeader title={t("invoices")}>
        <LinkButton href="/invoices/new">{t("newInvoice")}</LinkButton>
      </PageHeader>

      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
              <th className="px-5 py-3">{t("invoiceNumber")}</th>
              <th className="px-5 py-3">{t("customer")}</th>
              <th className="px-5 py-3">{t("date")}</th>
              <th className="px-5 py-3">{t("dueDate")}</th>
              <th className="px-5 py-3 text-right">{t("amount")}</th>
              <th className="px-5 py-3">{t("status")}</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="transition-colors hover:bg-surface-50">
                <td className="px-5 py-3.5 font-mono text-sm text-surface-900">{inv.invoiceNumber}</td>
                <td className="px-5 py-3.5 font-medium text-surface-700">{inv.companyName}</td>
                <td className="px-5 py-3.5 text-sm text-surface-600">{formatDate(inv.issueDate)}</td>
                <td className="px-5 py-3.5 text-sm text-surface-600">
                  {inv.dueDate ? formatDate(inv.dueDate) : "-"}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-sm text-surface-900">
                  {inv.totalCents != null ? formatCurrency(inv.totalCents) : "-"}
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={statusVariantMap[inv.status] ?? "default"}>
                    {statusKeyMap[inv.status]
                      ? t(statusKeyMap[inv.status])
                      : inv.status}
                  </Badge>
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
                <td colSpan={7} className="py-12 text-center text-surface-400">
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
