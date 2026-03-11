import { notFound, redirect } from "next/navigation";
import { getInvoiceById } from "@/lib/invoices/queries";
import { InvoiceEditForm } from "@/components/InvoiceEditForm";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getInvoiceById(id);
  if (!result) notFound();

  const { invoice, lines, contact } = result;

  if (invoice.status !== "draft") {
    redirect(`/invoices/${id}`);
  }

  return (
    <InvoiceEditForm
      invoiceId={invoice.id}
      initialData={{
        contactId: invoice.contactId,
        contactName: contact?.companyName ?? "",
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate ?? "",
        notes: invoice.notes ?? "",
        lines: lines.map((l) => ({
          description: l.description,
          quantity: Number(l.quantity),
          unitPriceCents: l.unitPriceCents,
          btwRate: l.btwRate,
        })),
      }}
    />
  );
}
