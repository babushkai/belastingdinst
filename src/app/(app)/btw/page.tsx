import { db } from "@/lib/db";
import { btwPeriods } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { saveBtwPeriod, lockAndFilePeriod } from "@/lib/btw/actions";
import { getSettings } from "@/lib/settings/actions";
import { BtwContent } from "@/components/BtwContent";
import { APP_FIRST_YEAR } from "@/lib/config";

export default async function BtwPage() {
  const [periods, settingsRow] = await Promise.all([
    db
      .select()
      .from(btwPeriods)
      .orderBy(desc(btwPeriods.year), desc(btwPeriods.periodNumber)),
    getSettings(),
  ]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);

  const lockedPeriodKeys = new Set(
    periods
      .filter((p) => p.locked && p.periodType === "quarterly")
      .map((p) => `${p.year}-${p.periodNumber}`),
  );

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
        omzetNulCents: p.omzetNulCents,
        btwHoogCents: p.btwHoogCents,
        btwLaagCents: p.btwLaagCents,
        btwInkoopCents: p.btwInkoopCents,
        btwTeBetalen: p.btwTeBetalen,
        confirmationNumber: p.confirmationNumber ?? null,
        filedAt: p.filedAt?.toISOString() ?? null,
      }))}
      currentYear={currentYear}
      currentQuarter={currentQuarter}
      firstYear={APP_FIRST_YEAR}
      lockedPeriodKeys={Array.from(lockedPeriodKeys)}
      btwNumber={settingsRow?.btwNumber ?? null}
      korActive={settingsRow?.korActive ?? false}
      calculateAction={saveBtwPeriod}
      fileAction={lockAndFilePeriod}
    />
  );
}
