import { db } from "@/lib/db";
import { btwPeriods } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings/actions";
import { BtwPrintView } from "./BtwPrintView";

export default async function BtwPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const { id } = await params;

  const [period] = await db
    .select()
    .from(btwPeriods)
    .where(eq(btwPeriods.id, id))
    .limit(1);

  if (!period) notFound();

  const settings = await getSettings();

  return (
    <BtwPrintView
      period={{
        periodNumber: period.periodNumber,
        year: period.year,
        status: period.status,
        omzetHoogCents: period.omzetHoogCents,
        omzetLaagCents: period.omzetLaagCents,
        omzetNulCents: period.omzetNulCents,
        btwHoogCents: period.btwHoogCents,
        btwLaagCents: period.btwLaagCents,
        btwInkoopCents: period.btwInkoopCents,
        btwTeBetalen: period.btwTeBetalen,
        confirmationNumber: period.confirmationNumber ?? null,
        filedAt: period.filedAt?.toISOString() ?? null,
      }}
      btwNumber={settings?.btwNumber ?? null}
      companyName={settings?.companyName ?? null}
    />
  );
}
