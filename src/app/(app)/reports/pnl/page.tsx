import { getPnlForYear } from "@/lib/reports/pnl";
import { PnlContent } from "@/components/PnlContent";

export default async function PnlPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const parsed = parseInt(yearParam ?? "");
  const year = Number.isFinite(parsed) && parsed >= 2000 && parsed <= 2100
    ? parsed
    : new Date().getFullYear();
  const pnl = await getPnlForYear(year);

  return <PnlContent year={year} pnl={pnl} />;
}
