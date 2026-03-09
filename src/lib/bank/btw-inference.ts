import type { ParsedTransaction } from "./types";

export interface BtwInferenceResult {
  btwCode: string | null;
  btwCodeSource: "auto" | "assumed" | null;
  btwCodeSuggested: string | null;
}

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
  "terugbetaling belasting",
  // Transfers / own accounts
  "spaarrekening", "tussenrekening", "eigen rekening", "own account",
  // Government benefits / transfers
  "zorgtoeslag", "kinderbijslag", "uitkering", "dividend",
  // Housing (residential rent = BTW-exempt)
  "hypotheek", "huur", "makelaar",
  // Healthcare (art. 11 lid 1 sub g Wet OB — vrijgesteld)
  "huisarts", "apotheek", "ziekenhuis", "tandarts", "fysiotherap",
];

/** Keywords that indicate 9% BTW (laag tarief) */
const LOW_RATE_KEYWORDS = [
  // Supermarkets
  "albert heijn", "jumbo", "lidl", "aldi", "spar", "dirk",
  "coop", "ekoplaza", "marqt", "picnic", "crisp", "hoogvliet",
  "vomar", "dekamarkt",
  // Food / hospitality
  "thuisbezorgd", "deliveroo", "uber eats", "restaurant", "cafe",
  "brood", "slager", "bakker",
  // Drugstores (food/personal care at 9%)
  "kruidvat", "etos",
  // Books / media / newspapers
  "bol.com", "boekhandel", "dagblad", "tijdschrift",
  // Accommodation
  "hotel", "camping", "airbnb", "booking.com", "hostel",
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
  "atlassian", "jetbrains", "1password", "bitwarden",
  "openai", "anthropic", "hubspot", "mailchimp", "sendgrid",
  // Payment processors
  "stripe", "mollie", "sumup",
  // Telecom
  "vodafone", "kpn", "t-mobile", "tele2", "ziggo", "odido",
  // Transport
  "ns.nl", "ov-chipkaart", "ov chipkaart", "shell", "esso", "total energies",
  "parkeren", "q-park", "connexxion", "arriva", "flixbus",
  // Airlines
  "ryanair", "easyjet", "klm", "transavia",
  // Car rental
  "sixt", "hertz", "europcar",
  // Hardware / supplies / retail
  "coolblue", "mediamarkt", "amazon", "ikea", "praxis", "gamma",
  "hornbach", "hema", "action",
  // Freelance platforms / services
  "fiverr", "upwork", "twilio",
  // Accounting / professional services
  "exact online",
];

/** Short keywords that need word-boundary matching */
const HIGH_RATE_WORD_PATTERNS = [/\bbp\b/, /\bns\b/];

/**
 * Infer BTW code for a parsed bank transaction (pure, sync).
 *
 * Priority: income/own-IBAN → EXEMPT → LOW_RATE → HIGH_RATE → assumed 21%
 *
 * - Credits (income): null — revenue BTW tracked via invoices
 * - Own-account transfers: null
 * - EXEMPT keyword: btwCode=null, source="auto"
 * - LOW_RATE keyword: btwCode="9", source="auto"
 * - HIGH_RATE keyword: btwCode="21", source="auto"
 * - No match (debit): btwCode=null, source="assumed", suggested="21"
 *   → UI-only suggestion, NOT counted in BTW calculation
 */
export function inferBtwCode(
  tx: ParsedTransaction,
  ownIbans?: Set<string>,
): BtwInferenceResult {
  const nil: BtwInferenceResult = { btwCode: null, btwCodeSource: null, btwCodeSuggested: null };

  // Income → no BTW code (revenue tracked via invoices)
  if (tx.amountCents >= 0) {
    return nil;
  }

  // Own-account transfer → no BTW
  if (ownIbans && tx.counterpartyIban && ownIbans.has(tx.counterpartyIban.toUpperCase())) {
    return nil;
  }

  const searchText = [
    tx.counterpartyName ?? "",
    tx.description ?? "",
  ].join(" ").toLowerCase();

  // No text to match → assumed 21% for debit
  if (searchText.trim() === "") {
    return { btwCode: null, btwCodeSource: "assumed", btwCodeSuggested: "21" };
  }

  // Exempt (no BTW reclaimable) — always wins
  if (EXEMPT_KEYWORDS.some((kw) => searchText.includes(kw))) {
    return { btwCode: null, btwCodeSource: "auto", btwCodeSuggested: null };
  }

  // Low rate (9%)
  if (
    LOW_RATE_KEYWORDS.some((kw) => searchText.includes(kw)) ||
    LOW_RATE_WORD_PATTERNS.some((re) => re.test(searchText))
  ) {
    return { btwCode: "9", btwCodeSource: "auto", btwCodeSuggested: null };
  }

  // High rate (21%) — recognized vendors
  if (
    HIGH_RATE_KEYWORDS.some((kw) => searchText.includes(kw)) ||
    HIGH_RATE_WORD_PATTERNS.some((re) => re.test(searchText))
  ) {
    return { btwCode: "21", btwCodeSource: "auto", btwCodeSuggested: null };
  }

  // Unknown debit — suggest 21% but don't store as btwCode
  return { btwCode: null, btwCodeSource: "assumed", btwCodeSuggested: "21" };
}
