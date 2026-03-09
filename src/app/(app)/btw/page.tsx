import { db } from "@/lib/db";
import { btwPeriods } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { saveBtwPeriod, lockAndFilePeriod } from "@/lib/btw/actions";
import { PeriodLockedError } from "@/lib/btw/period-guard";
import { BtwContent } from "@/components/BtwContent";

export default async function BtwPage() {
  const periods = await db
    .select()
    .from(btwPeriods)
    .orderBy(desc(btwPeriods.year), desc(btwPeriods.periodNumber));

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  // v1 only supports quarterly filing — matches the hardcoded "quarterly" in saveBtwPeriod
  const currentPeriodLocked = periods.some(
    (p) =>
      p.year === currentYear &&
      p.periodNumber === currentQuarter &&
      p.periodType === "quarterly" &&
      p.locked,
  );

  async function calculateAction(): Promise<{
    error?: string;
    locked?: true;
  }> {
    "use server";
    try {
      await saveBtwPeriod(currentYear, currentQuarter, "quarterly");
      return {};
    } catch (e) {
      if (e instanceof PeriodLockedError) {
        return { locked: true };
      }
      return { error: e instanceof Error ? e.message : "Unknown error" };
    }
  }

  async function fileAction(periodId: string): Promise<{
    error?: string;
    locked?: true;
  }> {
    "use server";
    try {
      await lockAndFilePeriod(periodId);
      return {};
    } catch (e) {
      if (e instanceof PeriodLockedError) {
        return { locked: true };
      }
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
      currentPeriodLocked={currentPeriodLocked}
      calculateAction={calculateAction}
      fileAction={fileAction}
    />
  );
}
