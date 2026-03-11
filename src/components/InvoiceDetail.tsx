"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { updateInvoiceStatus, deleteInvoice } from "@/lib/invoices/actions";
import { calculateInvoiceTotals } from "@/lib/invoices/calculations";
import { VALID_TRANSITIONS } from "@/lib/invoices/constants";
import type { TranslationKey } from "@/lib/i18n";

interface InvoiceDetailProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    issueDate: string;
    dueDate: string | null;
    currency: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  };
  lines: {
    id: string;
    description: string;
    quantity: number;
    unitPriceCents: number;
    btwRate: number;
    btwExemptReason: string | null;
    sortOrder: number;
  }[];
  contact: {
    id: string;
    companyName: string;
    email: string | null;
    addressStreet: string | null;
    addressCity: string | null;
    addressPostcode: string | null;
    btwNumber: string | null;
    kvkNumber: string | null;
  } | null;
  settings: {
    companyName: string;
    btwNumber: string | null;
    iban: string | null;
    addressStreet: string | null;
    addressCity: string | null;
    addressPostcode: string | null;
    kvkNumber: string | null;
  } | null;
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

export function InvoiceDetail({ invoice, lines, contact, settings }: InvoiceDetailProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    status?: string;
    delete?: boolean;
  } | null>(null);

  const totals = calculateInvoiceTotals(lines);
  const transitions = VALID_TRANSITIONS[invoice.status] ?? [];

  async function handleStatusChange(status: string) {
    setLoading(true);
    try {
      await updateInvoiceStatus(
        invoice.id,
        status as "draft" | "sent" | "paid" | "overdue" | "void",
      );
      router.refresh();
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteInvoice(invoice.id);
      router.push("/invoices");
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  }

  return (
    <div>
      <PageHeader title={`${t("invoiceNumber")} ${invoice.invoiceNumber}`}>
        {invoice.status === "draft" && (
          <LinkButton href={`/invoices/${invoice.id}/edit`} variant="secondary">
            {t("edit")}
          </LinkButton>
        )}
        <LinkButton
          href={`/api/invoices/${invoice.id}/pdf`}
          variant="secondary"
        >
          PDF
        </LinkButton>
      </PageHeader>

      {/* Header info */}
      <div className="border border-black bg-white p-6">
        <div className="flex flex-wrap justify-between gap-6">
          {/* From */}
          {settings && (
            <div>
              <p className="text-xs uppercase text-gray-500">{t("companyName")}</p>
              <p className="font-bold text-black">{settings.companyName}</p>
              {settings.addressStreet && (
                <p className="text-sm text-gray-600">{settings.addressStreet}</p>
              )}
              {(settings.addressPostcode || settings.addressCity) && (
                <p className="text-sm text-gray-600">
                  {[settings.addressPostcode, settings.addressCity].filter(Boolean).join(" ")}
                </p>
              )}
              {settings.btwNumber && (
                <p className="mt-1 text-xs text-gray-500">
                  {t("btwNumber")}: {settings.btwNumber}
                </p>
              )}
              {settings.kvkNumber && (
                <p className="text-xs text-gray-500">
                  {t("kvkNumber")}: {settings.kvkNumber}
                </p>
              )}
            </div>
          )}

          {/* To */}
          {contact && (
            <div>
              <p className="text-xs uppercase text-gray-500">{t("customer")}</p>
              <p className="font-bold text-black">{contact.companyName}</p>
              {contact.addressStreet && (
                <p className="text-sm text-gray-600">{contact.addressStreet}</p>
              )}
              {(contact.addressPostcode || contact.addressCity) && (
                <p className="text-sm text-gray-600">
                  {[contact.addressPostcode, contact.addressCity].filter(Boolean).join(" ")}
                </p>
              )}
              {contact.btwNumber && (
                <p className="mt-1 text-xs text-gray-500">
                  {t("btwNumber")}: {contact.btwNumber}
                </p>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="text-right">
            <Badge variant={statusVariantMap[invoice.status] ?? "default"}>
              {statusKeyMap[invoice.status]
                ? t(statusKeyMap[invoice.status])
                : invoice.status}
            </Badge>
            <p className="mt-2 text-sm text-gray-600">
              {t("date")}: {formatDate(invoice.issueDate)}
            </p>
            {invoice.dueDate && (
              <p className="text-sm text-gray-600">
                {t("dueDate")}: {formatDate(invoice.dueDate)}
              </p>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black text-left text-xs uppercase text-gray-500">
                <th className="pb-2">{t("description")}</th>
                <th className="pb-2 text-right">{t("quantity")}</th>
                <th className="pb-2 text-right">{t("unitPriceCents")}</th>
                <th className="pb-2 text-right">{t("btwPercent")}</th>
                <th className="pb-2 text-right">{t("total")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {lines.map((line) => {
                const lineTotal = Math.round(line.quantity * line.unitPriceCents);
                return (
                  <tr key={line.id}>
                    <td className="py-2 text-black">{line.description}</td>
                    <td className="py-2 text-right font-mono text-gray-600">
                      {line.quantity}
                    </td>
                    <td className="py-2 text-right font-mono text-gray-600">
                      {formatCurrency(line.unitPriceCents)}
                    </td>
                    <td className="py-2 text-right font-mono text-gray-600">
                      {line.btwRate}%
                    </td>
                    <td className="py-2 text-right font-mono text-black">
                      {formatCurrency(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 border-t border-black pt-4">
          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t("subtotal")}</span>
                <span className="font-mono text-black">
                  {formatCurrency(totals.subtotalCents)}
                </span>
              </div>
              {totals.btwBreakdown.map((b) => (
                <div key={b.rate} className="flex justify-between">
                  <span className="text-gray-600">
                    {t("btw")} {b.rate}%
                  </span>
                  <span className="font-mono text-black">
                    {formatCurrency(b.btwCents)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-t border-black pt-1 font-bold">
                <span className="text-black">{t("total")}</span>
                <span className="font-mono text-black">
                  {formatCurrency(totals.totalCents)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 border-t border-gray-300 pt-4">
            <p className="text-xs uppercase text-gray-500">{t("notes")}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-black">
              {invoice.notes}
            </p>
          </div>
        )}

        {/* Payment info */}
        {settings?.iban && (
          <div className="mt-4 border-t border-gray-300 pt-4">
            <p className="text-xs uppercase text-gray-500">{t("iban")}</p>
            <p className="mt-1 font-mono text-sm text-black">{settings.iban}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {(transitions.length > 0 || invoice.status === "draft") && (
        <div className="mt-4 flex flex-wrap gap-2">
          {transitions.map((status) => (
            <Button
              key={status}
              variant={status === "void" ? "danger" : "secondary"}
              size="sm"
              loading={loading}
              onClick={() => {
                if (status === "void") {
                  setConfirmAction({ status });
                } else {
                  handleStatusChange(status);
                }
              }}
            >
              {statusKeyMap[status] ? t(statusKeyMap[status]) : status}
            </Button>
          ))}
          {invoice.status === "draft" && (
            <Button
              variant="danger"
              size="sm"
              loading={loading}
              onClick={() => setConfirmAction({ delete: true })}
            >
              {t("deleteAction")}
            </Button>
          )}
        </div>
      )}

      {/* Confirm dialog for void/delete */}
      <ConfirmDialog
        open={!!confirmAction}
        title={
          confirmAction?.delete
            ? t("deleteAction")
            : confirmAction?.status
              ? statusKeyMap[confirmAction.status]
                ? t(statusKeyMap[confirmAction.status])
                : confirmAction.status
              : ""
        }
        message={
          confirmAction?.delete
            ? "Dit verwijdert de factuur permanent."
            : "Weet je zeker dat je de status wilt wijzigen?"
        }
        confirmLabel={confirmAction?.delete ? t("deleteAction") : t("save")}
        onConfirm={() => {
          if (confirmAction?.delete) handleDelete();
          else if (confirmAction?.status) handleStatusChange(confirmAction.status);
        }}
        onCancel={() => setConfirmAction(null)}
        loading={loading}
      />
    </div>
  );
}
