import { db } from "@/lib/db";
import { invoices, invoiceLines, transactions, settings } from "@/lib/db/schema";
import { eq, ne, and, gte, lte, lt, isNotNull, sql } from "drizzle-orm";

export interface BtwCalculation {
  omzetHoogCents: number; // Revenue at 21%
  omzetLaagCents: number; // Revenue at 9%
  omzetNulCents: number; // Revenue at 0%
  btwHoogCents: number; // VAT collected at 21%
  btwLaagCents: number; // VAT collected at 9%
  btwInkoopCents: number; // Input VAT (deductible)
  btwTeBetalen: number; // Net payable (positive = pay, negative = refund)
  korApplied: boolean;
}

interface PeriodDateRange {
  startDate: string;
  endDate: string;
}

export function getPeriodDateRange(
  year: number,
  periodNumber: number,
  periodType: "quarterly" | "monthly" | "annual",
): PeriodDateRange {
  if (periodType === "annual") {
    return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
  }
  if (periodType === "monthly") {
    const month = periodNumber.toString().padStart(2, "0");
    const lastDay = new Date(year, periodNumber, 0).getDate();
    return {
      startDate: `${year}-${month}-01`,
      endDate: `${year}-${month}-${lastDay}`,
    };
  }
  // quarterly
  const startMonth = ((periodNumber - 1) * 3 + 1).toString().padStart(2, "0");
  const endMonth = (periodNumber * 3).toString().padStart(2, "0");
  const lastDay = new Date(year, periodNumber * 3, 0).getDate();
  return {
    startDate: `${year}-${startMonth}-01`,
    endDate: `${year}-${endMonth}-${lastDay}`,
  };
}

export async function calculateBtwPeriod(
  year: number,
  periodNumber: number,
  periodType: "quarterly" | "monthly" | "annual",
): Promise<BtwCalculation> {
  const { startDate, endDate } = getPeriodDateRange(
    year,
    periodNumber,
    periodType,
  );

  // Revenue from invoices (issued, not void)
  const revenueLines = await db
    .select({
      btwRate: invoiceLines.btwRate,
      totalCents: sql<number>`sum(${invoiceLines.unitPriceCents} * ${invoiceLines.quantity}::int)::int`,
    })
    .from(invoiceLines)
    .innerJoin(invoices, eq(invoiceLines.invoiceId, invoices.id))
    .where(
      and(
        gte(invoices.issueDate, startDate),
        lte(invoices.issueDate, endDate),
        ne(invoices.status, "void"),
        ne(invoices.status, "draft"),
      ),
    )
    .groupBy(invoiceLines.btwRate);

  let omzetHoogCents = 0;
  let omzetLaagCents = 0;
  let omzetNulCents = 0;
  let btwHoogCents = 0;
  let btwLaagCents = 0;

  for (const row of revenueLines) {
    const total = row.totalCents ?? 0;
    switch (row.btwRate) {
      case 21:
        omzetHoogCents = total;
        btwHoogCents = Math.round(total * 0.21);
        break;
      case 9:
        omzetLaagCents = total;
        btwLaagCents = Math.round(total * 0.09);
        break;
      case 0:
        omzetNulCents = total;
        break;
    }
  }

  // Input VAT from expense transactions (negative amounts = purchases)
  const [expenseVat] = await db
    .select({
      totalVat: sql<number>`coalesce(sum(
        case
          when ${transactions.btwCode} = '21' then round(abs(${transactions.amountCents}) * 21.0 / 121.0)
          when ${transactions.btwCode} = '9' then round(abs(${transactions.amountCents}) * 9.0 / 109.0)
          else 0
        end
      ), 0)::int`,
    })
    .from(transactions)
    .where(
      and(
        gte(transactions.valueDate, startDate),
        lte(transactions.valueDate, endDate),
        lt(transactions.amountCents, 0),
        isNotNull(transactions.btwCode),
      ),
    );

  const btwInkoopCents = expenseVat?.totalVat ?? 0;

  // KOR (Kleineondernemersregeling) check
  const [settingsRow] = await db.select().from(settings).limit(1);
  let korApplied = false;

  if (settingsRow?.korActive) {
    // Calculate annual revenue to check KOR threshold (€20,000)
    const [annualRevenue] = await db
      .select({
        total: sql<number>`coalesce(sum(${invoiceLines.unitPriceCents} * ${invoiceLines.quantity}::int), 0)::int`,
      })
      .from(invoiceLines)
      .innerJoin(invoices, eq(invoiceLines.invoiceId, invoices.id))
      .where(
        and(
          gte(invoices.issueDate, `${year}-01-01`),
          lte(invoices.issueDate, `${year}-12-31`),
          ne(invoices.status, "void"),
          ne(invoices.status, "draft"),
        ),
      );

    if ((annualRevenue?.total ?? 0) < 2000000) {
      // Under €20,000 threshold
      korApplied = true;
    }
  }

  const btwTeBetalen = korApplied
    ? 0
    : btwHoogCents + btwLaagCents - btwInkoopCents;

  return {
    omzetHoogCents,
    omzetLaagCents,
    omzetNulCents,
    btwHoogCents,
    btwLaagCents,
    btwInkoopCents,
    btwTeBetalen,
    korApplied,
  };
}
