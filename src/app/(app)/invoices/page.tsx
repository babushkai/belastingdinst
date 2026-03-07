import Link from "next/link";
import { getInvoices } from "@/lib/invoices/queries";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  void: "bg-gray-100 text-gray-400",
};

const statusLabels: Record<string, string> = {
  draft: "Concept",
  sent: "Verzonden",
  paid: "Betaald",
  overdue: "Verlopen",
  void: "Geannuleerd",
};

export default async function InvoicesPage() {
  const allInvoices = await getInvoices();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Facturen</h1>
        <Link
          href="/invoices/new"
          className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Nieuwe factuur
        </Link>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="pb-2">Nummer</th>
            <th className="pb-2">Klant</th>
            <th className="pb-2">Datum</th>
            <th className="pb-2">Vervaldatum</th>
            <th className="pb-2">Status</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {allInvoices.map((inv) => (
            <tr key={inv.id} className="border-b">
              <td className="py-3 font-mono text-sm">{inv.invoiceNumber}</td>
              <td className="py-3">{inv.companyName}</td>
              <td className="py-3 text-sm">{inv.issueDate}</td>
              <td className="py-3 text-sm">{inv.dueDate ?? "-"}</td>
              <td className="py-3">
                <span
                  className={`rounded px-2 py-1 text-xs ${statusColors[inv.status] ?? ""}`}
                >
                  {statusLabels[inv.status] ?? inv.status}
                </span>
              </td>
              <td className="py-3 text-right">
                <Link
                  href={`/invoices/${inv.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Bekijken
                </Link>
              </td>
            </tr>
          ))}
          {allInvoices.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-gray-400">
                Nog geen facturen.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
