import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getInvoiceById } from "@/lib/invoices/queries";
import { getSettings } from "@/lib/settings/actions";
import { generateInvoicePdf } from "@/lib/invoices/pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await getInvoiceById(id);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const settings = await getSettings();
  const { invoice, lines, contact } = result;

  const buffer = await generateInvoicePdf(
    {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
    },
    lines.map((l) => ({
      description: l.description,
      quantity: Number(l.quantity),
      unitPriceCents: l.unitPriceCents,
      btwRate: l.btwRate,
    })),
    contact
      ? {
          companyName: contact.companyName ?? "",
          addressStreet: contact.addressStreet,
          addressPostcode: contact.addressPostcode,
          addressCity: contact.addressCity,
          btwNumber: contact.btwNumber,
        }
      : null,
    settings
      ? {
          companyName: settings.companyName,
          btwNumber: settings.btwNumber,
          kvkNumber: settings.kvkNumber,
          iban: settings.iban,
          addressStreet: settings.addressStreet,
          addressPostcode: settings.addressPostcode,
          addressCity: settings.addressCity,
        }
      : null,
  );

  const safeNumber = invoice.invoiceNumber.replace(/[^\w\-]/g, "_");
  const filename = `factuur-${safeNumber}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
