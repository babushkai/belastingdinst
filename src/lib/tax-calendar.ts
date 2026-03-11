export interface TaxDeadline {
  label: string;
  dueDate: string; // YYYY-MM-DD
  type: "btw" | "ib";
  quarter?: number;
  urgent: boolean;
  overdue: boolean;
}

// Dutch BTW quarterly deadlines (standard)
// Q1 → April 30, Q2 → July 31, Q3 → October 31, Q4 → January 31 (next year)
// IB → May 1 (next year), extended deadline September 1
const BTW_DEADLINES: { quarter: number; month: number; day: number; yearOffset: number }[] = [
  { quarter: 1, month: 4, day: 30, yearOffset: 0 },
  { quarter: 2, month: 7, day: 31, yearOffset: 0 },
  { quarter: 3, month: 10, day: 31, yearOffset: 0 },
  { quarter: 4, month: 1, day: 31, yearOffset: 1 },
];

export function getTaxDeadlines(
  year: number,
  filedQuarters: number[] = [],
): TaxDeadline[] {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const deadlines: TaxDeadline[] = [];

  // BTW quarterly deadlines
  for (const d of BTW_DEADLINES) {
    const dueYear = year + d.yearOffset;
    const dueDate = `${dueYear}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
    const isFiled = filedQuarters.includes(d.quarter);

    deadlines.push({
      label: `BTW Q${d.quarter} ${year}`,
      dueDate,
      type: "btw",
      quarter: d.quarter,
      urgent: !isFiled && dueDate <= thirtyDaysFromNow && dueDate >= todayStr,
      overdue: !isFiled && dueDate < todayStr,
    });
  }

  // IB deadline (standard: May 1 of following year)
  const ibDate = `${year + 1}-05-01`;
  deadlines.push({
    label: `IB ${year}`,
    dueDate: ibDate,
    type: "ib",
    urgent: ibDate <= thirtyDaysFromNow && ibDate >= todayStr,
    overdue: ibDate < todayStr,
  });

  return deadlines;
}
