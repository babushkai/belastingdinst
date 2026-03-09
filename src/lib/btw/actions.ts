"use server";

import { db } from "@/lib/db";
import { btwPeriods } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { calculateBtwPeriod } from "./calculator";
import { auth } from "@/lib/auth/config";
import { validateQuarterlyPeriod } from "./validate";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Niet ingelogd");
}

/**
 * Calculate BTW for a given quarter. Reads year/quarter from FormData hidden inputs.
 */
export async function saveBtwPeriod(
  formData: FormData,
): Promise<{ error?: string; locked?: true }> {
  try {
    await requireAuth();

    const year = Number(formData.get("year"));
    const quarter = Number(formData.get("quarter"));
    validateQuarterlyPeriod(year, quarter);

    const calc = await calculateBtwPeriod(year, quarter, "quarterly");

    // Atomic upsert: try update with locked=false guard first
    const existing = await db
      .select({ id: btwPeriods.id, locked: btwPeriods.locked })
      .from(btwPeriods)
      .where(
        and(
          eq(btwPeriods.year, year),
          eq(btwPeriods.periodNumber, quarter),
          eq(btwPeriods.periodType, "quarterly"),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].locked) {
        return { locked: true };
      }

      // Conditional update — only if still unlocked (guards against concurrent lock)
      const updated = await db
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
        .where(
          and(
            eq(btwPeriods.id, existing[0].id),
            eq(btwPeriods.locked, false),
          ),
        )
        .returning({ id: btwPeriods.id });

      if (updated.length === 0) {
        return { locked: true };
      }
    } else {
      await db.insert(btwPeriods).values({
        year,
        periodNumber: quarter,
        periodType: "quarterly",
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
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/**
 * Lock and file a BTW period. Uses atomic conditional update.
 */
export async function lockAndFilePeriod(
  periodId: string,
): Promise<{ error?: string; locked?: true }> {
  try {
    await requireAuth();

    // Atomic: only update if not already locked
    const result = await db
      .update(btwPeriods)
      .set({
        locked: true,
        status: "filed",
        filedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(btwPeriods.id, periodId),
          eq(btwPeriods.locked, false),
        ),
      )
      .returning({ id: btwPeriods.id });

    if (result.length === 0) {
      // Either not found or already locked
      return { locked: true };
    }

    revalidatePath("/btw");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
