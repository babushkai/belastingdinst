import { describe, it, expect } from "vitest";
import { inferBtwCode } from "../btw-inference";
import type { ParsedTransaction } from "../types";

function makeTx(overrides: Partial<ParsedTransaction> = {}): ParsedTransaction {
  return {
    externalId: "test-1",
    valueDate: "2025-01-15",
    amountCents: -5000,
    importSource: "mt940",
    ...overrides,
  };
}

describe("inferBtwCode", () => {
  it("returns null for credit (income) transactions", () => {
    const result = inferBtwCode(makeTx({ amountCents: 10000 }));
    expect(result.btwCode).toBeNull();
    expect(result.btwCodeSource).toBeNull();
  });

  it("returns null for zero amount", () => {
    const result = inferBtwCode(makeTx({ amountCents: 0 }));
    expect(result.btwCode).toBeNull();
  });

  it("returns null for unknown debit with no description", () => {
    const result = inferBtwCode(makeTx());
    expect(result.btwCode).toBeNull();
    expect(result.btwCodeSource).toBeNull();
  });

  it("returns 21% for recognized software vendor", () => {
    const result = inferBtwCode(makeTx({ counterpartyName: "GitHub Inc" }));
    expect(result.btwCode).toBe("21");
    expect(result.btwCodeSource).toBe("auto");
  });

  it("returns 9% for supermarket", () => {
    const result = inferBtwCode(makeTx({ counterpartyName: "Albert Heijn 1234" }));
    expect(result.btwCode).toBe("9");
    expect(result.btwCodeSource).toBe("auto");
  });

  it("returns null for salary keyword", () => {
    const result = inferBtwCode(makeTx({ description: "Salaris januari" }));
    expect(result.btwCode).toBeNull();
    expect(result.btwCodeSource).toBe("auto");
  });

  it("returns null for bank fees", () => {
    const result = inferBtwCode(makeTx({ description: "Transactiekosten Q4" }));
    expect(result.btwCode).toBeNull();
    expect(result.btwCodeSource).toBe("auto");
  });

  it("returns null for insurance", () => {
    const result = inferBtwCode(makeTx({ counterpartyName: "OHRA Verzekering" }));
    expect(result.btwCode).toBeNull();
    expect(result.btwCodeSource).toBe("auto");
  });

  it("matches case-insensitively", () => {
    const result = inferBtwCode(makeTx({ counterpartyName: "COOLBLUE B.V." }));
    expect(result.btwCode).toBe("21");
    expect(result.btwCodeSource).toBe("auto");
  });

  it("matches on description when counterpartyName is absent", () => {
    const result = inferBtwCode(makeTx({ description: "Betaling aan Microsoft" }));
    expect(result.btwCode).toBe("21");
    expect(result.btwCodeSource).toBe("auto");
  });

  it("returns null for own-account transfers", () => {
    const ownIbans = new Set(["NL01BANK1234567890"]);
    const result = inferBtwCode(
      makeTx({ counterpartyIban: "NL01BANK1234567890" }),
      ownIbans,
    );
    expect(result.btwCode).toBeNull();
    expect(result.btwCodeSource).toBeNull();
  });

  it("returns null for unknown generic debit", () => {
    const result = inferBtwCode(makeTx({ description: "Betaling ref 12345" }));
    expect(result.btwCode).toBeNull();
    expect(result.btwCodeSource).toBeNull();
  });

  it("exempt rules take priority over low-rate", () => {
    // "premie" is exempt; should not match food
    const result = inferBtwCode(makeTx({ description: "Premie zorgverzekering" }));
    expect(result.btwCode).toBeNull();
    expect(result.btwCodeSource).toBe("auto");
  });
});
