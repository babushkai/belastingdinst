import { describe, it, expect } from "vitest";
import { formatCurrency, centsToEuros, eurosToCents, centsToWholeEuros, formatDate } from "../format";

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

describe("formatDate", () => {
  it("formats ISO date to nl-NL", () => {
    const result = formatDate("2025-03-15");
    expect(result).toContain("15");
    expect(result).toContain("2025");
  });
});
