import { db } from "@/lib/db";
import { btwPeriods } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { saveBtwPeriod, lockAndFilePeriod } from "@/lib/btw/actions";
import { BtwContent } from "@/components/BtwContent";

export default async function BtwPage() {
  const periods = await db
    .select()
    .from(btwPeriods)
    .orderBy(desc(btwPeriods.year), desc(btwPeriods.periodNumber));

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  async function calculateAction(): Promise<{ error?: string }> {
    "use server";
    try {
      await saveBtwPeriod(currentYear, currentQuarter, "quarterly");
      return {};
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Unknown error" };
    }
  }

  async function fileAction(periodId: string): Promise<{ error?: string }> {
    "use server";
    try {
      await lockAndFilePeriod(periodId);
      return {};
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Unknown error" };
    }
  }

  return (
    <BtwContent
      periods={periods.map((p) => ({
        id: p.id,
        periodNumber: p.periodNumber,
        year: p.year,
        status: p.status,
        locked: p.locked,
        omzetHoogCents: p.omzetHoogCents,
        omzetLaagCents: p.omzetLaagCents,
        btwHoogCents: p.btwHoogCents,
        btwLaagCents: p.btwLaagCents,
        btwInkoopCents: p.btwInkoopCents,
        btwTeBetalen: p.btwTeBetalen,
      }))}
      currentYear={currentYear}
      currentQuarter={currentQuarter}
      calculateAction={calculateAction}
      fileAction={fileAction}
    />
  );
}
