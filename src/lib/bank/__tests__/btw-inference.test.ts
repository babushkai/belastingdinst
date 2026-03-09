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
    expect(result.btwCodeSuggested).toBeNull();
  });

  it("returns null for zero amount", () => {
    const result = inferBtwCode(makeTx({ amountCents: 0 }));
    expect(result.btwCode).toBeNull();
    expect(result.btwCodeSource).toBeNull();
  });

  it("returns assumed 21% for debit with no description", () => {
    const result = inferBtwCode(makeTx());
    expect(result.btwCode).toBeNull();
    expect(result.btwCodeSource).toBe("assumed");
    expect(result.btwCodeSuggested).toBe("21");
  });

  it("returns 21% for recognized software vendor", () => {
    const result = inferBtwCode(makeTx({ counterpartyName: "GitHub Inc" }));
    expect(result.btwCode).toBe("21");
    expect(result.btwCodeSource).toBe("auto");
    expect(result.btwCodeSuggested).toBeNull();
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
    expect(result.btwCodeSuggested).toBeNull();
  });

  it("returns assumed for unknown generic debit", () => {
    const result = inferBtwCode(makeTx({ description: "Betaling ref 12345" }));
    expect(result.btwCode).toBeNull();
    expect(result.btwCodeSource).toBe("assumed");
    expect(result.btwCodeSuggested).toBe("21");
  });

  it("exempt rules take priority over low-rate", () => {
    const result = inferBtwCode(makeTx({ description: "Premie zorgverzekering" }));
    expect(result.btwCode).toBeNull();
    expect(result.btwCodeSource).toBe("auto");
  });

  // New keyword tests
  it("returns 21% for OpenAI", () => {
    const result = inferBtwCode(makeTx({ counterpartyName: "OpenAI LLC" }));
    expect(result.btwCode).toBe("21");
    expect(result.btwCodeSource).toBe("auto");
  });

  it("returns 21% for Stripe", () => {
    const result = inferBtwCode(makeTx({ description: "Stripe payments fee" }));
    expect(result.btwCode).toBe("21");
  });

  it("returns null for healthcare (huisarts)", () => {
    const result = inferBtwCode(makeTx({ counterpartyName: "Huisartspraktijk De Vaart" }));
    expect(result.btwCode).toBeNull();
    expect(result.btwCodeSource).toBe("auto");
  });

  it("returns null for mortgage (hypotheek)", () => {
    const result = inferBtwCode(makeTx({ description: "Hypotheek maandtermijn" }));
    expect(result.btwCode).toBeNull();
    expect(result.btwCodeSource).toBe("auto");
  });

  it("returns 9% for Booking.com", () => {
    const result = inferBtwCode(makeTx({ description: "Booking.com reservation" }));
    expect(result.btwCode).toBe("9");
    expect(result.btwCodeSource).toBe("auto");
  });

  it("matches NS with word boundary", () => {
    const result = inferBtwCode(makeTx({ description: "NS treinkaart" }));
    expect(result.btwCode).toBe("21");
  });

  it("does not match NS inside other words", () => {
    const result = inferBtwCode(makeTx({ counterpartyName: "PENSIONS Corp" }));
    expect(result.btwCode).toBeNull();
    // Should be assumed, not auto-matched as NS
    expect(result.btwCodeSource).toBe("assumed");
  });
});
