import { describe, it, expect } from "vitest";
import { calculateInvoiceTotals } from "../calculations";

describe("calculateInvoiceTotals", () => {
  it("handles single line at 21%", () => {
    const result = calculateInvoiceTotals([
      { quantity: 8, unitPriceCents: 7500, btwRate: 21 },
    ]);
    expect(result.subtotalCents).toBe(60000);
    expect(result.totalBtwCents).toBe(12600);
    expect(result.totalCents).toBe(72600);
  });

  it("handles multiple rates correctly", () => {
    const result = calculateInvoiceTotals([
      { quantity: 1, unitPriceCents: 100000, btwRate: 21 },
      { quantity: 1, unitPriceCents: 50000, btwRate: 9 },
      { quantity: 1, unitPriceCents: 25000, btwRate: 0 },
    ]);
    expect(result.subtotalCents).toBe(175000);
    expect(result.totalBtwCents).toBe(21000 + 4500);
    expect(result.totalCents).toBe(175000 + 25500);
  });

  it("returns sorted breakdown by rate descending", () => {
    const result = calculateInvoiceTotals([
      { quantity: 1, unitPriceCents: 1000, btwRate: 0 },
      { quantity: 1, unitPriceCents: 1000, btwRate: 9 },
      { quantity: 1, unitPriceCents: 1000, btwRate: 21 },
    ]);
    expect(result.btwBreakdown[0].rate).toBe(21);
    expect(result.btwBreakdown[1].rate).toBe(9);
    expect(result.btwBreakdown[2].rate).toBe(0);
  });
});
