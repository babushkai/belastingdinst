import { describe, it, expect } from "vitest";
import { normalizeCounterpartyName } from "../normalize-counterparty";

describe("normalizeCounterpartyName", () => {
  it("lowercases and trims", () => {
    expect(normalizeCounterpartyName("  Coolblue  ")).toBe("coolblue");
  });

  it("strips B.V.", () => {
    expect(normalizeCounterpartyName("Coolblue B.V.")).toBe("coolblue");
  });

  it("strips BV (no dots)", () => {
    expect(normalizeCounterpartyName("Coolblue BV")).toBe("coolblue");
  });

  it("strips N.V.", () => {
    expect(normalizeCounterpartyName("ING Bank N.V.")).toBe("ing bank");
  });

  it("strips VOF", () => {
    expect(normalizeCounterpartyName("Bakkerij Jansen VOF")).toBe("bakkerij jansen");
  });

  it("strips V.O.F.", () => {
    expect(normalizeCounterpartyName("Bakkerij Jansen V.O.F.")).toBe("bakkerij jansen");
  });

  it("strips trailing 4+ digit store/terminal numbers", () => {
    expect(normalizeCounterpartyName("Albert Heijn 1234")).toBe("albert heijn");
  });

  it("preserves short trailing numbers (store identifiers)", () => {
    expect(normalizeCounterpartyName("Lidl 42")).toBe("lidl 42");
  });

  it("collapses double spaces", () => {
    expect(normalizeCounterpartyName("Albert  Heijn")).toBe("albert heijn");
  });

  it("returns empty string for whitespace input", () => {
    expect(normalizeCounterpartyName("   ")).toBe("");
  });

  it("handles combined suffix and store number", () => {
    expect(normalizeCounterpartyName("Shell Station B.V. 5678")).toBe("shell station");
  });
});
