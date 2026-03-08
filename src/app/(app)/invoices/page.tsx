import { getInvoices } from "@/lib/invoices/queries";
import { InvoicesContent } from "@/components/InvoicesContent";

export default async function InvoicesPage() {
  const allInvoices = await getInvoices();

  return (
    <InvoicesContent
      invoices={allInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        companyName: inv.companyName,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        status: inv.status,
      }))}
    />
  );
}
