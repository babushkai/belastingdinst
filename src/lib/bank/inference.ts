import { db } from "@/lib/db";
import { btwInferenceRules } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
}

export async function inferBtwCode(
  userId: string,
  tx: { counterpartyIban: string | null; counterpartyName: string | null },
): Promise<string | null> {
  // Priority 1: match by IBAN
  if (tx.counterpartyIban) {
    const [rule] = await db
      .select({ btwCode: btwInferenceRules.btwCode })
      .from(btwInferenceRules)
      .where(
        and(
          eq(btwInferenceRules.userId, userId),
          eq(btwInferenceRules.counterpartyIban, tx.counterpartyIban),
        ),
      )
      .limit(1);
    if (rule) return rule.btwCode;
  }

  // Priority 2: match by normalized name
  if (tx.counterpartyName) {
    const normalized = normalizeName(tx.counterpartyName);
    if (normalized.length >= 3) {
      const [rule] = await db
        .select({ btwCode: btwInferenceRules.btwCode })
        .from(btwInferenceRules)
        .where(
          and(
            eq(btwInferenceRules.userId, userId),
            eq(btwInferenceRules.normalizedName, normalized),
          ),
        )
        .limit(1);
      if (rule) return rule.btwCode;
    }
  }

  return null;
}

export async function learnFromCategorisation(
  userId: string,
  tx: {
    counterpartyIban: string | null;
    counterpartyName: string | null;
  },
  btwCode: string,
): Promise<void> {
  // Require a counterpartyName for learning — IBAN alone is not a stable key
  if (!tx.counterpartyName) return;

  const normalized = normalizeName(tx.counterpartyName);
  if (normalized.length < 3) return;

  // Atomic upsert: on conflict (userId, normalizedName) update btwCode
  await db
    .insert(btwInferenceRules)
    .values({
      userId,
      normalizedName: normalized,
      rawNameSample: tx.counterpartyName.slice(0, 100),
      counterpartyIban: tx.counterpartyIban,
      btwCode,
    })
    .onConflictDoUpdate({
      target: [btwInferenceRules.userId, btwInferenceRules.normalizedName],
      set: {
        btwCode,
        counterpartyIban: tx.counterpartyIban,
        updatedAt: new Date(),
      },
    });
}
