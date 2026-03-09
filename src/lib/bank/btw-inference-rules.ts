import { db } from "@/lib/db";
import { btwInferenceRules } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { normalizeCounterpartyName } from "./normalize-counterparty";
import { inferBtwCode } from "./btw-inference";
import type { ParsedTransaction } from "./types";

export interface FullInferenceResult {
  btwCode: string | null;
  btwCodeSource: "auto" | "learned" | "assumed" | null;
  btwCodeSuggested: string | null;
  inferenceRuleId: string | null;
}

/**
 * Look up a learned BTW rule by normalized name (primary) or IBAN (fallback).
 * IBAN is non-unique — used as a hint when name lookup misses.
 */
export async function lookupInferenceRule(
  userId: string,
  normalizedName: string,
  iban?: string | null,
): Promise<{ btwCode: string; id: string } | null> {
  if (normalizedName) {
    const [byName] = await db
      .select({ id: btwInferenceRules.id, btwCode: btwInferenceRules.btwCode })
      .from(btwInferenceRules)
      .where(and(
        eq(btwInferenceRules.userId, userId),
        eq(btwInferenceRules.normalizedName, normalizedName),
      ))
      .limit(1);
    if (byName) return byName;
  }

  if (iban) {
    const [byIban] = await db
      .select({ id: btwInferenceRules.id, btwCode: btwInferenceRules.btwCode })
      .from(btwInferenceRules)
      .where(and(
        eq(btwInferenceRules.userId, userId),
        eq(btwInferenceRules.counterpartyIban, iban.toUpperCase()),
      ))
      .limit(1);
    if (byIban) return byIban;
  }

  return null;
}

/**
 * Upsert a learned BTW rule. Keyed on (userId, normalized_name) — IBAN is enrichment.
 * Does nothing if name normalizes to empty string.
 */
export async function upsertInferenceRule(
  userId: string,
  rawName: string,
  iban: string | null,
  btwCode: string,
): Promise<void> {
  const normalized = normalizeCounterpartyName(rawName);
  if (!normalized) return;

  const truncatedRaw = rawName.slice(0, 200);

  await db
    .insert(btwInferenceRules)
    .values({
      userId,
      normalizedName: normalized,
      rawNameSample: truncatedRaw,
      counterpartyIban: iban?.toUpperCase() ?? null,
      btwCode,
    })
    .onConflictDoUpdate({
      target: [btwInferenceRules.userId, btwInferenceRules.normalizedName],
      set: {
        btwCode,
        rawNameSample: truncatedRaw,
        counterpartyIban: iban?.toUpperCase() ?? null,
        updatedAt: new Date(),
      },
    });
}

/**
 * Delete a learned rule when user clears a BTW code (prevents stale rules).
 */
export async function deleteInferenceRule(
  userId: string,
  rawName: string,
): Promise<void> {
  const normalized = normalizeCounterpartyName(rawName);
  if (!normalized) return;

  await db
    .delete(btwInferenceRules)
    .where(and(
      eq(btwInferenceRules.userId, userId),
      eq(btwInferenceRules.normalizedName, normalized),
    ));
}

/**
 * Pre-fetch all inference rules for a user into a Map (avoids N+1 on import).
 */
export async function loadAllInferenceRules(userId: string): Promise<{
  byName: Map<string, { btwCode: string; id: string }>;
  byIban: Map<string, { btwCode: string; id: string }>;
}> {
  const rules = await db
    .select({
      id: btwInferenceRules.id,
      normalizedName: btwInferenceRules.normalizedName,
      counterpartyIban: btwInferenceRules.counterpartyIban,
      btwCode: btwInferenceRules.btwCode,
    })
    .from(btwInferenceRules)
    .where(eq(btwInferenceRules.userId, userId));

  const byName = new Map<string, { btwCode: string; id: string }>();
  const byIban = new Map<string, { btwCode: string; id: string }>();

  for (const r of rules) {
    byName.set(r.normalizedName, { btwCode: r.btwCode, id: r.id });
    if (r.counterpartyIban) {
      byIban.set(r.counterpartyIban, { btwCode: r.btwCode, id: r.id });
    }
  }

  return { byName, byIban };
}

/**
 * Apply full inference pipeline with correct priority:
 *   own-IBAN → EXEMPT → learned → LOW/HIGH keywords → assumed
 *
 * Learned rules override keyword matches (user explicitly taught a different code).
 * Only own-IBAN and EXEMPT are non-overridable by learned rules.
 */
export function applyLearnedRuleSync(
  tx: ParsedTransaction,
  ownIbans: Set<string> | undefined,
  rulesMap: { byName: Map<string, { btwCode: string; id: string }>; byIban: Map<string, { btwCode: string; id: string }> },
): FullInferenceResult {
  const base = inferBtwCode(tx, ownIbans);

  // Own-IBAN (null/null) and EXEMPT (null/"auto") are non-overridable
  if (base.btwCodeSource === null || (base.btwCodeSource === "auto" && base.btwCode === null)) {
    return { ...base, inferenceRuleId: null };
  }

  // Try learned rule — overrides both keyword matches and assumed
  const normalized = tx.counterpartyName
    ? normalizeCounterpartyName(tx.counterpartyName)
    : "";
  const iban = tx.counterpartyIban?.toUpperCase();

  const rule = (normalized ? rulesMap.byName.get(normalized) : undefined)
    ?? (iban ? rulesMap.byIban.get(iban) : undefined);

  if (rule) {
    return {
      btwCode: rule.btwCode,
      btwCodeSource: "learned",
      btwCodeSuggested: null,
      inferenceRuleId: rule.id,
    };
  }

  // No learned rule — keep keyword or assumed result
  return { ...base, inferenceRuleId: null };
}
