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

      <div className="border border-black bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black bg-gray-100 text-left text-xs uppercase text-black">
              <th className="px-5 py-3">{t("invoiceNumber")}</th>
              <th className="px-5 py-3">{t("customer")}</th>
              <th className="px-5 py-3">{t("date")}</th>
              <th className="px-5 py-3">{t("dueDate")}</th>
              <th className="px-5 py-3 text-right">{t("amount")}</th>
              <th className="px-5 py-3">{t("status")}</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5 font-mono text-sm text-black">{inv.invoiceNumber}</td>
                <td className="px-5 py-3.5 font-medium text-black">{inv.companyName}</td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{formatDate(inv.issueDate)}</td>
                <td className="px-5 py-3.5 text-sm text-gray-600">
                  {inv.dueDate ? formatDate(inv.dueDate) : "-"}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-sm text-black">
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
                    className="text-sm font-medium text-[#0000cc] underline hover:text-[#000099]"
                  >
                    {t("view")}
                  </Link>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
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
