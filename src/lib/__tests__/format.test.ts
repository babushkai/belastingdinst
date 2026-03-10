import { describe, it, expect } from "vitest";
import { formatCurrency, centsToEuros, eurosToCents, centsToWholeEuros, formatDate, buildCopyAllText } from "../format";

describe("formatCurrency", () => {
  it("formats positive cents to EUR", () => {
    expect(formatCurrency(1050)).toContain("10,50");
  });

  it("formats negative cents", () => {
    const result = formatCurrency(-2500);
    expect(result).toContain("25,00");
    expect(result).toContain("-");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toContain("0,00");
  });
});

describe("centsToEuros / eurosToCents round-trip", () => {
  it("converts cents to euros string", () => {
    expect(centsToEuros(1099)).toBe("10.99");
  });

  it("converts euros string to cents", () => {
    expect(eurosToCents("10.99")).toBe(1099);
  });

  it("handles round-trip correctly", () => {
    const original = 4295;
    expect(eurosToCents(centsToEuros(original))).toBe(original);
  });

  it("returns 0 for NaN input", () => {
    expect(eurosToCents("abc")).toBe(0);
    expect(eurosToCents("")).toBe(0);
  });

  it("handles Dutch comma-decimal notation", () => {
    expect(eurosToCents("10,50")).toBe(1050);
    expect(eurosToCents("1.234,56")).toBe(123456);
  });
});

describe("centsToWholeEuros", () => {
  it("truncates to whole euros", () => {
    expect(centsToWholeEuros(4999)).toBe("49");
  });

  it("handles zero", () => {
    expect(centsToWholeEuros(0)).toBe("0");
  });

  it("handles negative amounts as absolute value", () => {
    expect(centsToWholeEuros(-500)).toBe("5");
  });

  it("truncates down, not rounds up", () => {
    expect(centsToWholeEuros(99)).toBe("0");
    expect(centsToWholeEuros(150)).toBe("1");
  });
});

describe("buildCopyAllText", () => {
  it("formats all rubrieken with correct values", () => {
    const result = buildCopyAllText({
      periodNumber: 1,
      year: 2026,
      omzetHoogCents: 1000000,
      omzetLaagCents: 500000,
      omzetNulCents: 200000,
      btwHoogCents: 210000,
      btwLaagCents: 45000,
      btwInkoopCents: 50000,
      btwTeBetalen: 205000,
    });

    expect(result).toBe(
      [
        "BTW-aangifte Q1 2026",
        "1a Omzet 21%: 10000",
        "1a BTW 21%:   2100",
        "1b Omzet 9%:  5000",
        "1b BTW 9%:    450",
        "1e Omzet 0%:  2000",
        "5b Voorbelasting: 500",
        "Te betalen: 2050",
      ].join("\n"),
    );
  });

  it("handles zero amounts", () => {
    const result = buildCopyAllText({
      periodNumber: 3,
      year: 2025,
      omzetHoogCents: 500000,
      omzetLaagCents: 0,
      omzetNulCents: 0,
      btwHoogCents: 105000,
      btwLaagCents: 0,
      btwInkoopCents: 0,
      btwTeBetalen: 0,
    });

    expect(result).toContain("BTW-aangifte Q3 2025");
    expect(result).toContain("Te betalen: 0");
  });

  it("handles negative te betalen (refund) as absolute value", () => {
    const result = buildCopyAllText({
      periodNumber: 4,
      year: 2025,
      omzetHoogCents: 100000,
      omzetLaagCents: 0,
      omzetNulCents: 0,
      btwHoogCents: 21000,
      btwLaagCents: 0,
      btwInkoopCents: 50000,
      btwTeBetalen: -29000,
    });

    expect(result).toContain("Terug te ontvangen: 290");
  });
});

describe("formatDate", () => {
  it("formats ISO date to nl-NL", () => {
    const result = formatDate("2025-03-15");
    expect(result).toContain("15");
    expect(result).toContain("2025");
  });
});
