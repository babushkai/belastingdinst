"use server";

import { db } from "@/lib/db";
import { btwPeriods } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { calculateBtwPeriod } from "./calculator";
import { auth } from "@/lib/auth/config";

type PeriodType = "quarterly" | "monthly" | "annual";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Niet ingelogd");
}

export async function previewBtwPeriod(
  year: number,
  periodNumber: number,
  periodType: PeriodType,
) {
  await requireAuth();
  return calculateBtwPeriod(year, periodNumber, periodType);
}

export async function saveBtwPeriod(
  year: number,
  periodNumber: number,
  periodType: PeriodType,
) {
  await requireAuth();
  const calc = await calculateBtwPeriod(year, periodNumber, periodType);

  // Upsert
  const existing = await db
    .select()
    .from(btwPeriods)
    .where(
      and(
        eq(btwPeriods.year, year),
        eq(btwPeriods.periodNumber, periodNumber),
        eq(btwPeriods.periodType, periodType),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].locked) {
      throw new Error("BTW-periode is vergrendeld en kan niet worden gewijzigd.");
    }

    await db
      .update(btwPeriods)
      .set({
        omzetHoogCents: calc.omzetHoogCents,
        omzetLaagCents: calc.omzetLaagCents,
        omzetNulCents: calc.omzetNulCents,
        btwHoogCents: calc.btwHoogCents,
        btwLaagCents: calc.btwLaagCents,
        btwInkoopCents: calc.btwInkoopCents,
        btwTeBetalen: calc.btwTeBetalen,
        status: "calculated",
        updatedAt: new Date(),
      })
      .where(eq(btwPeriods.id, existing[0].id));
  } else {
    await db.insert(btwPeriods).values({
      year,
      periodNumber,
      periodType,
      omzetHoogCents: calc.omzetHoogCents,
      omzetLaagCents: calc.omzetLaagCents,
      omzetNulCents: calc.omzetNulCents,
      btwHoogCents: calc.btwHoogCents,
      btwLaagCents: calc.btwLaagCents,
      btwInkoopCents: calc.btwInkoopCents,
      btwTeBetalen: calc.btwTeBetalen,
      status: "calculated",
    });
  }

  revalidatePath("/btw");
}

export async function lockAndFilePeriod(periodId: string) {
  await requireAuth();
  await db
    .update(btwPeriods)
    .set({
      locked: true,
      status: "filed",
      filedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(btwPeriods.id, periodId));

  revalidatePath("/btw");
}
