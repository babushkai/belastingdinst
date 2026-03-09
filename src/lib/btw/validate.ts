import { APP_FIRST_YEAR } from "@/lib/config";

export function validateQuarterlyPeriod(year: number, quarter: number): void {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);

  if (!Number.isInteger(year) || !Number.isInteger(quarter)) {
    throw new Error("Jaar en kwartaal moeten gehele getallen zijn");
  }
  if (year < APP_FIRST_YEAR || year > currentYear) {
    throw new Error(`Jaar moet tussen ${APP_FIRST_YEAR} en ${currentYear} liggen`);
  }
  if (quarter < 1 || quarter > 4) {
    throw new Error("Kwartaal moet tussen 1 en 4 liggen");
  }
  // year > currentYear already rejected above, so only same-year future quarters remain
  if (year === currentYear && quarter > currentQuarter) {
    throw new Error("Kan geen BTW berekenen voor een toekomstig kwartaal");
  }
}
