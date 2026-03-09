/**
 * Normalize a counterparty name for use as a lookup key in btw_inference_rules.
 *
 * Strips legal suffixes (B.V., N.V., VOF), trailing POS/terminal IDs (4+ digits),
 * collapses whitespace, lowercases.
 */
export function normalizeCounterpartyName(raw: string): string {
  let name = raw.toLowerCase().trim();

  // Strip trailing 4+ digit sequences first (POS/terminal IDs, store numbers)
  name = name.replace(/\s+\d{4,}\s*$/, "");

  // Strip common Dutch legal suffixes
  name = name.replace(/\s*(b\.?v\.?|n\.?v\.?|v\.?o\.?f\.?)\s*$/i, "");

  // Collapse multiple spaces
  name = name.replace(/\s+/g, " ").trim();

  return name;
}
