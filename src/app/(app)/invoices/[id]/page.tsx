import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/invoices/queries";
import { InvoiceDetail } from "@/components/InvoiceDetail";
import { getSettings } from "@/lib/settings/actions";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getInvoiceById(id);
  if (!result) notFound();

  const settings = await getSettings();

  const { invoice, lines, contact } = result;

  return (
    <InvoiceDetail
      invoice={{
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        currency: invoice.currency,
        notes: invoice.notes,
        createdAt: invoice.createdAt.toISOString(),
        updatedAt: invoice.updatedAt.toISOString(),
      }}
      lines={lines.map((l) => ({
        id: l.id,
        description: l.description,
        quantity: Number(l.quantity),
        unitPriceCents: l.unitPriceCents,
        btwRate: l.btwRate,
        btwExemptReason: l.btwExemptReason,
        sortOrder: l.sortOrder,
      }))}
      contact={
        contact
          ? {
              id: contact.id,
              companyName: contact.companyName ?? "",
              email: contact.email,
              addressStreet: contact.addressStreet,
              addressCity: contact.addressCity,
              addressPostcode: contact.addressPostcode,
              btwNumber: contact.btwNumber,
              kvkNumber: contact.kvkNumber,
            }
          : null
      }
      settings={
        settings
          ? {
              companyName: settings.companyName,
              btwNumber: settings.btwNumber,
              iban: settings.iban,
              addressStreet: settings.addressStreet,
              addressCity: settings.addressCity,
              addressPostcode: settings.addressPostcode,
              kvkNumber: settings.kvkNumber,
            }
          : null
      }
    />
  );
}
