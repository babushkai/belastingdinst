import { describe, it, expect } from "vitest";
import { validateQuarterlyPeriod } from "../validate";

const currentYear = new Date().getFullYear();
const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

describe("validateQuarterlyPeriod", () => {
  it("accepts valid current quarter", () => {
    expect(() => validateQuarterlyPeriod(currentYear, currentQuarter)).not.toThrow();
  });

  it("accepts past year Q4", () => {
    expect(() => validateQuarterlyPeriod(currentYear - 1, 4)).not.toThrow();
  });

  it("accepts first supported year Q1", () => {
    expect(() => validateQuarterlyPeriod(2020, 1)).not.toThrow();
  });

  it("rejects year before APP_FIRST_YEAR", () => {
    expect(() => validateQuarterlyPeriod(2019, 1)).toThrow(/2020/);
  });

  it("rejects year after current year", () => {
    expect(() => validateQuarterlyPeriod(currentYear + 1, 1)).toThrow(/Jaar moet/);
  });

  it("rejects quarter 0", () => {
    expect(() => validateQuarterlyPeriod(currentYear, 0)).toThrow(/1 en 4/);
  });

  it("rejects quarter 5", () => {
    expect(() => validateQuarterlyPeriod(currentYear, 5)).toThrow(/1 en 4/);
  });

  it("rejects future quarter in current year", () => {
    if (currentQuarter < 4) {
      expect(() =>
        validateQuarterlyPeriod(currentYear, currentQuarter + 1),
      ).toThrow(/toekomstig/);
    }
  });

  it("rejects non-integer year", () => {
    expect(() => validateQuarterlyPeriod(2024.5, 1)).toThrow(/gehele getallen/);
  });

  it("rejects non-integer quarter", () => {
    expect(() => validateQuarterlyPeriod(2024, 1.5)).toThrow(/gehele getallen/);
  });
});
