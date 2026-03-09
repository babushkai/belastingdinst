export interface InvoiceLine {
  quantity: number;
  unitPriceCents: number;
  btwRate: number; // 0, 9, or 21
}

export interface InvoiceCalculation {
  subtotalCents: number;
  btwBreakdown: { rate: number; baseCents: number; btwCents: number }[];
  totalBtwCents: number;
  totalCents: number;
}

export function calculateInvoiceTotals(
  lines: InvoiceLine[],
): InvoiceCalculation {
  const byRate = new Map<number, { baseCents: number; btwCents: number }>();

  let subtotalCents = 0;

  for (const line of lines) {
    const lineTotal = Math.round(line.quantity * line.unitPriceCents);
    const lineBtw = Math.round(lineTotal * (line.btwRate / 100));

    subtotalCents += lineTotal;

    const existing = byRate.get(line.btwRate) ?? { baseCents: 0, btwCents: 0 };
    existing.baseCents += lineTotal;
    existing.btwCents += lineBtw;
    byRate.set(line.btwRate, existing);
  }

  const btwBreakdown = Array.from(byRate.entries())
    .map(([rate, { baseCents, btwCents }]) => ({ rate, baseCents, btwCents }))
    .sort((a, b) => b.rate - a.rate);

  const totalBtwCents = btwBreakdown.reduce((sum, b) => sum + b.btwCents, 0);

  return {
    subtotalCents,
    btwBreakdown,
    totalBtwCents,
    totalCents: subtotalCents + totalBtwCents,
  };
}
