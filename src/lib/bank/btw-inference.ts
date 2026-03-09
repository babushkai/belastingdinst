import type { ParsedTransaction } from "./types";

/** Keywords that indicate no BTW is reclaimable */
const EXEMPT_KEYWORDS = [
  // Salary / payroll
  "salaris", "loon", "payroll", "salarisbet",
  // Bank fees / interest
  "rente", "kosten", "servicefee", "bank fee", "provisie", "interest",
  "transactiekosten", "boekingskosten",
  // Insurance (BTW-vrijgesteld art. 11 Wet OB)
  "verzekering", "insurance", "premie", "polis",
  // Tax / government
  "belastingdienst", "inkomstenbelasting", "btw-aangifte",
  // Transfers / own accounts
  "spaarrekening", "tussenrekening",
];

/** Keywords that indicate 9% BTW (laag tarief) */
const LOW_RATE_KEYWORDS = [
  // Supermarkets
  "albert heijn", "jumbo", "lidl", "aldi", "spar", "dirk",
  "coop", "ekoplaza", "marqt",
  // Food / hospitality
  "thuisbezorgd", "deliveroo", "uber eats", "restaurant", "cafe",
  // Books / media
  "bol.com", "boekhandel",
  // Accommodation
  "hotel", "camping",
];

/** Short keywords that need word-boundary matching to avoid false positives */
const LOW_RATE_WORD_PATTERNS = [/\bah\b/, /\bplus\b/];

/** Keywords that identify common BTW-reclaimable business expenses at 21% */
const HIGH_RATE_KEYWORDS = [
  // Office / workspace
  "kantoor", "office", "coworking", "regus", "spaces",
  // Software / digital services
  "microsoft", "google", "adobe", "github", "aws", "digitalocean",
  "heroku", "vercel", "netlify", "slack", "notion", "figma", "zoom",
  "dropbox", "icloud", "apple.com", "spotify",
  // Telecom
  "vodafone", "kpn", "t-mobile", "tele2", "ziggo", "odido",
  // Transport
  "ns.nl", "ov-chipkaart", "shell", "esso", "total energies",
  "parkeren", "q-park",
  // Hardware / supplies
  "coolblue", "mediamarkt", "amazon",
  // Freelance platforms / services
  "fiverr", "upwork",
];

/** Short keywords that need word-boundary matching */
const HIGH_RATE_WORD_PATTERNS = [/\bbp\b/];

/**
 * Infer BTW code for a parsed bank transaction.
 *
 * Rules:
 * - Credits (income): always null — revenue BTW is tracked via invoices
 * - Debits (expenses): keyword match → specific rate; no match → null (unknown)
 * - Own-account transfers: null
 *
 * @param ownIbans - Set of the user's own bank account IBANs for self-transfer detection
 */
export function inferBtwCode(
  tx: ParsedTransaction,
  ownIbans?: Set<string>,
): { btwCode: string | null; btwCodeSource: "auto" | null } {
  // Income → no BTW code (revenue tracked via invoices)
  if (tx.amountCents > 0) {
    return { btwCode: null, btwCodeSource: null };
  }

  // Own-account transfer → no BTW, not classified
  if (ownIbans && tx.counterpartyIban && ownIbans.has(tx.counterpartyIban.toUpperCase())) {
    return { btwCode: null, btwCodeSource: null };
  }

  const searchText = [
    tx.counterpartyName ?? "",
    tx.description ?? "",
  ].join(" ").toLowerCase();

  // No text to match → unknown
  if (searchText.trim() === "") {
    return { btwCode: null, btwCodeSource: null };
  }

  // Exempt (no BTW reclaimable)
  if (EXEMPT_KEYWORDS.some((kw) => searchText.includes(kw))) {
    return { btwCode: null, btwCodeSource: "auto" };
  }

  // Low rate (9%)
  if (
    LOW_RATE_KEYWORDS.some((kw) => searchText.includes(kw)) ||
    LOW_RATE_WORD_PATTERNS.some((re) => re.test(searchText))
  ) {
    return { btwCode: "9", btwCodeSource: "auto" };
  }

  // High rate (21%) — only for recognized vendors
  if (
    HIGH_RATE_KEYWORDS.some((kw) => searchText.includes(kw)) ||
    HIGH_RATE_WORD_PATTERNS.some((re) => re.test(searchText))
  ) {
    return { btwCode: "21", btwCodeSource: "auto" };
  }

  // Unknown — leave for user to classify
  return { btwCode: null, btwCodeSource: null };
}
