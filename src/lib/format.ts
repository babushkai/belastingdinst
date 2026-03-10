const currencyFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatCurrency(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export function centsToEuros(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function eurosToCents(euros: string): number {
  // Handle Dutch notation: 1.234,56 → 1234.56
  const normalized = euros.includes(",")
    ? euros.replace(/\./g, "").replace(",", ".")
    : euros;
  const parsed = parseFloat(normalized);
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  if (Number.isNaN(date.getTime())) return dateStr;
  return dateFormatter.format(date);
}

/** Whole non-negative euros for Belastingdienst portal (truncates towards zero) */
export function centsToWholeEuros(cents: number): string {
  return String(Math.trunc(Math.abs(cents) / 100));
}

/** Build plain-text BTW summary for clipboard — matches portal field order */
export function buildCopyAllText(period: {
  periodNumber: number;
  year: number;
  omzetHoogCents: number;
  omzetLaagCents: number;
  omzetNulCents: number;
  btwHoogCents: number;
  btwLaagCents: number;
  btwInkoopCents: number;
  btwTeBetalen: number;
}): string {
  const p = period;
  return [
    `BTW-aangifte Q${p.periodNumber} ${p.year}`,
    `1a Omzet 21%: ${centsToWholeEuros(p.omzetHoogCents)}`,
    `1a BTW 21%:   ${centsToWholeEuros(p.btwHoogCents)}`,
    `1b Omzet 9%:  ${centsToWholeEuros(p.omzetLaagCents)}`,
    `1b BTW 9%:    ${centsToWholeEuros(p.btwLaagCents)}`,
    `1e Omzet 0%:  ${centsToWholeEuros(p.omzetNulCents)}`,
    `5b Voorbelasting: ${centsToWholeEuros(p.btwInkoopCents)}`,
    p.btwTeBetalen < 0
      ? `Terug te ontvangen: ${centsToWholeEuros(p.btwTeBetalen)}`
      : `Te betalen: ${centsToWholeEuros(p.btwTeBetalen)}`,
  ].join("\n");
}

export function formatRelativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "vandaag";
  if (diffDays === 1) return "gisteren";
  if (diffDays < 7) return `${diffDays} dagen geleden`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weken geleden`;
  return dateFormatter.format(date);
}
