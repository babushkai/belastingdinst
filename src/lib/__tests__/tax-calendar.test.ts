import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getTaxDeadlines } from "../tax-calendar";

describe("getTaxDeadlines", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns correct BTW quarterly deadlines for a year", () => {
    vi.setSystemTime(new Date("2026-01-15"));
    const deadlines = getTaxDeadlines(2025);

    const btw = deadlines.filter((d) => d.type === "btw");
    expect(btw).toHaveLength(4);
    expect(btw[0].dueDate).toBe("2025-04-30");
    expect(btw[1].dueDate).toBe("2025-07-31");
    expect(btw[2].dueDate).toBe("2025-10-31");
    expect(btw[3].dueDate).toBe("2026-01-31"); // Q4 is next year
  });

  it("returns IB deadline on May 1 of following year", () => {
    vi.setSystemTime(new Date("2026-01-15"));
    const deadlines = getTaxDeadlines(2025);

    const ib = deadlines.find((d) => d.type === "ib");
    expect(ib).toBeDefined();
    expect(ib!.dueDate).toBe("2026-05-01");
  });

  it("marks deadline as urgent when within 30 days", () => {
    vi.setSystemTime(new Date("2026-04-10"));
    const deadlines = getTaxDeadlines(2026);

    const q1 = deadlines.find((d) => d.label === "BTW Q1 2026");
    expect(q1).toBeDefined();
    expect(q1!.urgent).toBe(true);
    expect(q1!.overdue).toBe(false);
  });

  it("marks deadline as overdue when past due", () => {
    vi.setSystemTime(new Date("2026-05-15"));
    const deadlines = getTaxDeadlines(2026);

    const q1 = deadlines.find((d) => d.label === "BTW Q1 2026");
    expect(q1).toBeDefined();
    expect(q1!.overdue).toBe(true);
  });

  it("excludes filed quarters from urgent/overdue", () => {
    vi.setSystemTime(new Date("2026-05-15"));
    const deadlines = getTaxDeadlines(2026, [1]);

    const q1 = deadlines.find((d) => d.label === "BTW Q1 2026");
    expect(q1).toBeDefined();
    expect(q1!.urgent).toBe(false);
    expect(q1!.overdue).toBe(false);
  });
});
