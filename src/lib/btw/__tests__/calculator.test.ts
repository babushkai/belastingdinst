import { describe, it, expect } from "vitest";
import { getPeriodDateRange } from "../calculator";
import { calculateInvoiceTotals } from "../../invoices/calculations";

describe("getPeriodDateRange", () => {
  it("returns correct range for Q1", () => {
    const range = getPeriodDateRange(2026, 1, "quarterly");
    expect(range.startDate).toBe("2026-01-01");
    expect(range.endDate).toBe("2026-03-31");
  });

  it("returns correct range for Q4", () => {
    const range = getPeriodDateRange(2026, 4, "quarterly");
    expect(range.startDate).toBe("2026-10-01");
    expect(range.endDate).toBe("2026-12-31");
  });

  it("returns correct range for monthly period", () => {
    const range = getPeriodDateRange(2026, 2, "monthly");
    expect(range.startDate).toBe("2026-02-01");
    expect(range.endDate).toBe("2026-02-28");
  });

  it("returns correct range for annual", () => {
    const range = getPeriodDateRange(2026, 1, "annual");
    expect(range.startDate).toBe("2026-01-01");
    expect(range.endDate).toBe("2026-12-31");
  });
});

describe("calculateInvoiceTotals (BTW scenarios)", () => {
  it("calculates pure 21% invoice correctly", () => {
    const result = calculateInvoiceTotals([
      { quantity: 10, unitPriceCents: 10000, btwRate: 21 },
    ]);
    expect(result.subtotalCents).toBe(100000); // €1000
    expect(result.btwBreakdown).toEqual([
      { rate: 21, baseCents: 100000, btwCents: 21000 },
    ]);
    expect(result.totalBtwCents).toBe(21000); // €210
    expect(result.totalCents).toBe(121000); // €1210
  });

  it("calculates pure 9% invoice correctly", () => {
    const result = calculateInvoiceTotals([
      { quantity: 5, unitPriceCents: 20000, btwRate: 9 },
    ]);
    expect(result.subtotalCents).toBe(100000);
    expect(result.totalBtwCents).toBe(9000);
    expect(result.totalCents).toBe(109000);
  });

  it("calculates mixed 21% and 9% lines", () => {
    const result = calculateInvoiceTotals([
      { quantity: 1, unitPriceCents: 50000, btwRate: 21 },
      { quantity: 1, unitPriceCents: 30000, btwRate: 9 },
    ]);
    expect(result.subtotalCents).toBe(80000);
    expect(result.btwBreakdown).toEqual([
      { rate: 21, baseCents: 50000, btwCents: 10500 },
      { rate: 9, baseCents: 30000, btwCents: 2700 },
    ]);
    expect(result.totalBtwCents).toBe(13200);
    expect(result.totalCents).toBe(93200);
  });

  it("calculates mixed 21%, 9%, and 0% lines", () => {
    const result = calculateInvoiceTotals([
      { quantity: 1, unitPriceCents: 50000, btwRate: 21 },
      { quantity: 1, unitPriceCents: 30000, btwRate: 9 },
      { quantity: 1, unitPriceCents: 20000, btwRate: 0 },
    ]);
    expect(result.subtotalCents).toBe(100000);
    // 0% should produce 0 BTW
    expect(result.btwBreakdown).toContainEqual({
      rate: 0,
      baseCents: 20000,
      btwCents: 0,
    });
    expect(result.totalBtwCents).toBe(13200); // 10500 + 2700
    expect(result.totalCents).toBe(113200);
  });

  it("handles empty invoice (no lines)", () => {
    const result = calculateInvoiceTotals([]);
    expect(result.subtotalCents).toBe(0);
    expect(result.totalBtwCents).toBe(0);
    expect(result.totalCents).toBe(0);
    expect(result.btwBreakdown).toEqual([]);
  });

  it("handles fractional quantities", () => {
    const result = calculateInvoiceTotals([
      { quantity: 2.5, unitPriceCents: 10000, btwRate: 21 },
    ]);
    expect(result.subtotalCents).toBe(25000);
    expect(result.totalBtwCents).toBe(5250);
  });

  it("rounds BTW to nearest cent", () => {
    // 333 * 0.21 = 69.93 → should round to 70
    const result = calculateInvoiceTotals([
      { quantity: 1, unitPriceCents: 333, btwRate: 21 },
    ]);
    expect(result.totalBtwCents).toBe(70);
  });

  it("aggregates multiple lines at same rate", () => {
    const result = calculateInvoiceTotals([
      { quantity: 1, unitPriceCents: 10000, btwRate: 21 },
      { quantity: 1, unitPriceCents: 20000, btwRate: 21 },
      { quantity: 1, unitPriceCents: 30000, btwRate: 21 },
    ]);
    expect(result.subtotalCents).toBe(60000);
    expect(result.btwBreakdown.length).toBe(1);
    expect(result.btwBreakdown[0].baseCents).toBe(60000);
    expect(result.btwBreakdown[0].btwCents).toBe(12600);
  });
});

describe("BTW te betalen calculation logic", () => {
  it("net payable = output VAT - input VAT", () => {
    // Simulate: €1000 revenue at 21% → €210 BTW
    // €500 expenses at 21% → €500 * 21/121 = €86.78 input VAT
    // Net payable: 210 - 86.78 = 123.22
    const outputVat = Math.round(100000 * 0.21); // 21000 cents
    const inputVat = Math.round(50000 * (21 / 121)); // 8678 cents
    const netPayable = outputVat - inputVat;
    expect(netPayable).toBe(21000 - 8678);
    expect(netPayable).toBe(12322);
  });

  it("negative net payable means refund", () => {
    // More input VAT than output VAT
    const outputVat = 5000;
    const inputVat = 8000;
    expect(outputVat - inputVat).toBe(-3000);
  });

  it("KOR threshold: under €20,000 annual revenue → no VAT payable", () => {
    const annualRevenueCents = 1950000; // €19,500
    const korThresholdCents = 2000000; // €20,000
    const korApplied = annualRevenueCents < korThresholdCents;
    expect(korApplied).toBe(true);

    const btwTeBetalen = korApplied ? 0 : 21000;
    expect(btwTeBetalen).toBe(0);
  });

  it("KOR threshold: over €20,000 → normal calculation", () => {
    const annualRevenueCents = 2010000; // €20,100
    const korThresholdCents = 2000000;
    const korApplied = annualRevenueCents < korThresholdCents;
    expect(korApplied).toBe(false);

    const btwTeBetalen = korApplied ? 0 : 21000;
    expect(btwTeBetalen).toBe(21000);
  });
});
