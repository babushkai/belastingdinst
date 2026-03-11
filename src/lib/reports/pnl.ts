import { db } from "@/lib/db";
import { invoices, invoiceLines, transactions } from "@/lib/db/schema";
import { eq, ne, and, gte, lte, lt, isNotNull, sql } from "drizzle-orm";

export interface PnlResult {
  revenueExVatCents: number;
  expensesExVatCents: number;
  grossProfitCents: number;
  revenueByQuarter: { quarter: number; cents: number }[];
  uncategorisedExpenseCount: number;
}

export async function getPnlForYear(year: number): Promise<PnlResult> {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  // Revenue from non-void, non-draft invoices (ex VAT = line totals without BTW)
  const [revenue] = await db
    .select({
      total: sql<number>`coalesce(sum(
        round(${invoiceLines.unitPriceCents} * ${invoiceLines.quantity}::numeric)
      ), 0)::int`,
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
    );

  const revenueExVatCents = revenue?.total ?? 0;

  // Revenue by quarter
  const quarterlyRevenue = await db
    .select({
      quarter: sql<number>`extract(quarter from ${invoices.issueDate}::date)::int`,
      total: sql<number>`coalesce(sum(
        round(${invoiceLines.unitPriceCents} * ${invoiceLines.quantity}::numeric)
      ), 0)::int`,
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
    .groupBy(sql`extract(quarter from ${invoices.issueDate}::date)`);

  const revenueByQuarter = [1, 2, 3, 4].map((q) => ({
    quarter: q,
    cents: quarterlyRevenue.find((r) => r.quarter === q)?.total ?? 0,
  }));

  // Expenses from categorised transactions (negative amounts with btwCode set)
  // We extract the ex-VAT amount from the inclusive amount
  const [expenses] = await db
    .select({
      total: sql<number>`coalesce(sum(
        case
          when ${transactions.btwCode} = '21' then round(abs(${transactions.amountCents}) * 100.0 / 121.0)
          when ${transactions.btwCode} = '9' then round(abs(${transactions.amountCents}) * 100.0 / 109.0)
          when ${transactions.btwCode} = '0' then abs(${transactions.amountCents})
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

  const expensesExVatCents = expenses?.total ?? 0;

  // Count uncategorised expense transactions (warning indicator)
  const [uncategorised] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(transactions)
    .where(
      and(
        gte(transactions.valueDate, startDate),
        lte(transactions.valueDate, endDate),
        lt(transactions.amountCents, 0),
        sql`${transactions.btwCode} is null`,
      ),
    );

  return {
    revenueExVatCents,
    expensesExVatCents,
    grossProfitCents: revenueExVatCents - expensesExVatCents,
    revenueByQuarter,
    uncategorisedExpenseCount: uncategorised?.count ?? 0,
  };
}
