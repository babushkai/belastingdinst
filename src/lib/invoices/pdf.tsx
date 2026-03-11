import "server-only";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  bold: { fontFamily: "Helvetica-Bold" },
  small: { fontSize: 8, color: "#666" },
  label: { fontSize: 8, color: "#666", marginBottom: 2, textTransform: "uppercase" },
  section: { marginBottom: 16 },
  row: { flexDirection: "row" },
  divider: { borderBottomWidth: 1, borderBottomColor: "#000", marginVertical: 8 },
  thinDivider: { borderBottomWidth: 0.5, borderBottomColor: "#ccc", marginVertical: 4 },
  // Table
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  colDesc: { flex: 1 },
  colQty: { width: 50, textAlign: "right" },
  colPrice: { width: 70, textAlign: "right" },
  colBtw: { width: 40, textAlign: "right" },
  colTotal: { width: 80, textAlign: "right" },
  // Totals
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", paddingVertical: 2 },
  totalsLabel: { width: 100, textAlign: "right", marginRight: 10 },
  totalsValue: { width: 80, textAlign: "right", fontFamily: "Helvetica" },
  totalsBold: { width: 80, textAlign: "right", fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#666" },
});

function fmt(cents: number): string {
  const abs = Math.abs(cents);
  const sign = cents < 0 ? "-" : "";
  return `${sign}\u20AC ${(abs / 100).toFixed(2).replace(".", ",")}`;
}

interface PdfInvoice {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  notes: string | null;
}

interface PdfLine {
  description: string;
  quantity: number;
  unitPriceCents: number;
  btwRate: number;
}

interface PdfContact {
  companyName: string;
  addressStreet: string | null;
  addressPostcode: string | null;
  addressCity: string | null;
  btwNumber: string | null;
}

interface PdfSettings {
  companyName: string;
  btwNumber: string | null;
  kvkNumber: string | null;
  iban: string | null;
  addressStreet: string | null;
  addressPostcode: string | null;
  addressCity: string | null;
}

function InvoicePdf({
  invoice,
  lines,
  contact,
  settings,
}: {
  invoice: PdfInvoice;
  lines: PdfLine[];
  contact: PdfContact | null;
  settings: PdfSettings | null;
}) {
  const btwByRate = new Map<number, { base: number; btw: number }>();
  let subtotal = 0;

  for (const line of lines) {
    const lineTotal = Math.round(line.quantity * line.unitPriceCents);
    const lineBtw = Math.round(lineTotal * (line.btwRate / 100));
    subtotal += lineTotal;
    const existing = btwByRate.get(line.btwRate) ?? { base: 0, btw: 0 };
    existing.base += lineTotal;
    existing.btw += lineBtw;
    btwByRate.set(line.btwRate, existing);
  }

  const totalBtw = Array.from(btwByRate.values()).reduce((s, v) => s + v.btw, 0);
  const total = subtotal + totalBtw;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header: Company + Invoice meta */}
        <View style={s.header}>
          <View>
            {settings && (
              <>
                <Text style={[s.bold, { fontSize: 14 }]}>{settings.companyName}</Text>
                {settings.addressStreet && <Text>{settings.addressStreet}</Text>}
                {(settings.addressPostcode || settings.addressCity) && (
                  <Text>
                    {[settings.addressPostcode, settings.addressCity].filter(Boolean).join(" ")}
                  </Text>
                )}
                {settings.btwNumber && (
                  <Text style={s.small}>BTW: {settings.btwNumber}</Text>
                )}
                {settings.kvkNumber && (
                  <Text style={s.small}>KvK: {settings.kvkNumber}</Text>
                )}
              </>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[s.bold, { fontSize: 16 }]}>FACTUUR</Text>
            <Text style={{ marginTop: 4 }}>{invoice.invoiceNumber}</Text>
            <Text style={s.small}>Datum: {invoice.issueDate}</Text>
            {invoice.dueDate && (
              <Text style={s.small}>Vervaldatum: {invoice.dueDate}</Text>
            )}
          </View>
        </View>

        {/* Bill to */}
        {contact && (
          <View style={s.section}>
            <Text style={s.label}>Aan</Text>
            <Text style={s.bold}>{contact.companyName}</Text>
            {contact.addressStreet && <Text>{contact.addressStreet}</Text>}
            {(contact.addressPostcode || contact.addressCity) && (
              <Text>
                {[contact.addressPostcode, contact.addressCity].filter(Boolean).join(" ")}
              </Text>
            )}
            {contact.btwNumber && (
              <Text style={s.small}>BTW: {contact.btwNumber}</Text>
            )}
          </View>
        )}

        <View style={s.divider} />

        {/* Line items table */}
        <View style={s.tableHeader}>
          <Text style={[s.colDesc, s.bold]}>Omschrijving</Text>
          <Text style={[s.colQty, s.bold]}>Aantal</Text>
          <Text style={[s.colPrice, s.bold]}>Prijs</Text>
          <Text style={[s.colBtw, s.bold]}>BTW</Text>
          <Text style={[s.colTotal, s.bold]}>Totaal</Text>
        </View>
        {lines.map((line, i) => {
          const lineTotal = Math.round(line.quantity * line.unitPriceCents);
          return (
            <View key={i} style={s.tableRow}>
              <Text style={s.colDesc}>{line.description}</Text>
              <Text style={s.colQty}>{line.quantity}</Text>
              <Text style={s.colPrice}>{fmt(line.unitPriceCents)}</Text>
              <Text style={s.colBtw}>{line.btwRate}%</Text>
              <Text style={s.colTotal}>{fmt(lineTotal)}</Text>
            </View>
          );
        })}

        <View style={s.divider} />

        {/* Totals */}
        <View style={s.totalsRow}>
          <Text style={s.totalsLabel}>Subtotaal</Text>
          <Text style={s.totalsValue}>{fmt(subtotal)}</Text>
        </View>
        {Array.from(btwByRate.entries())
          .sort((a, b) => b[0] - a[0])
          .map(([rate, { btw }]) => (
            <View key={rate} style={s.totalsRow}>
              <Text style={s.totalsLabel}>BTW {rate}%</Text>
              <Text style={s.totalsValue}>{fmt(btw)}</Text>
            </View>
          ))}
        <View style={[s.totalsRow, { borderTopWidth: 1, borderTopColor: "#000", paddingTop: 4 }]}>
          <Text style={[s.totalsLabel, s.bold]}>Totaal</Text>
          <Text style={s.totalsBold}>{fmt(total)}</Text>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={{ marginTop: 20 }}>
            <Text style={s.label}>Opmerkingen</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        {/* Payment info */}
        {settings?.iban && (
          <View style={{ marginTop: 20 }}>
            <Text style={s.label}>Betaling</Text>
            <Text>
              Gelieve te betalen op IBAN: {settings.iban}
            </Text>
            <Text>
              o.v.v. factuurnummer {invoice.invoiceNumber}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.divider} />
          <View style={s.row}>
            {settings && <Text>{settings.companyName}</Text>}
            {settings?.btwNumber && <Text> | BTW: {settings.btwNumber}</Text>}
            {settings?.kvkNumber && <Text> | KvK: {settings.kvkNumber}</Text>}
            {settings?.iban && <Text> | IBAN: {settings.iban}</Text>}
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInvoicePdf(
  invoice: PdfInvoice,
  lines: PdfLine[],
  contact: PdfContact | null,
  settings: PdfSettings | null,
): Promise<Buffer> {
  return renderToBuffer(
    <InvoicePdf invoice={invoice} lines={lines} contact={contact} settings={settings} />,
  );
}
