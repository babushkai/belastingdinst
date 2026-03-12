import { describe, it, expect } from "vitest";
import { amountToCents, buildExternalId } from "../importer";
import type { GcTransaction } from "../client";

describe("amountToCents", () => {
  it("converts positive amounts", () => {
    expect(amountToCents("12.50")).toBe(1250);
    expect(amountToCents("1000.00")).toBe(100000);
    expect(amountToCents("0.01")).toBe(1);
    expect(amountToCents("0.10")).toBe(10);
  });

  it("converts negative amounts", () => {
    expect(amountToCents("-12.50")).toBe(-1250);
    expect(amountToCents("-0.01")).toBe(-1);
  });

  it("handles no decimal part", () => {
    expect(amountToCents("100")).toBe(10000);
    expect(amountToCents("-5")).toBe(-500);
  });

  it("handles single decimal digit", () => {
    expect(amountToCents("12.5")).toBe(1250);
    expect(amountToCents("-3.1")).toBe(-310);
  });

  it("avoids floating-point precision loss", () => {
    // parseFloat("10.07") * 100 = 1006.9999... which rounds wrong
    expect(amountToCents("10.07")).toBe(1007);
    expect(amountToCents("-10.07")).toBe(-1007);
    expect(amountToCents("33.33")).toBe(3333);
  });

  it("handles zero", () => {
    expect(amountToCents("0.00")).toBe(0);
    expect(amountToCents("0")).toBe(0);
  });
});

describe("buildExternalId", () => {
  const baseTx: GcTransaction = {
    transactionId: "TX123",
    bookingDate: "2026-01-15",
    transactionAmount: { amount: "-50.00", currency: "EUR" },
    creditorName: "Acme Corp",
  };

  it("uses transactionId when available", () => {
    expect(buildExternalId("acc-1", baseTx)).toBe("gc-TX123");
  });

  it("generates hash fallback when transactionId missing", () => {
    const tx = { ...baseTx, transactionId: undefined };
    const id = buildExternalId("acc-1", tx);
    expect(id).toMatch(/^gc-2026-01-15-[a-f0-9]{16}$/);
  });

  it("generates different IDs for different accounts", () => {
    const tx = { ...baseTx, transactionId: undefined };
    const id1 = buildExternalId("acc-1", tx);
    const id2 = buildExternalId("acc-2", tx);
    expect(id1).not.toBe(id2);
  });

  it("generates stable IDs for same input", () => {
    const tx = { ...baseTx, transactionId: undefined };
    const id1 = buildExternalId("acc-1", tx);
    const id2 = buildExternalId("acc-1", tx);
    expect(id1).toBe(id2);
  });
});
