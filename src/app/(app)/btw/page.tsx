import { db } from "@/lib/db";
import { btwPeriods } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { saveBtwPeriod, lockAndFilePeriod } from "@/lib/btw/actions";

const statusColors: Record<string, string> = {
  open: "bg-gray-100 text-gray-700",
  calculated: "bg-blue-100 text-blue-700",
  filed: "bg-green-100 text-green-700",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  calculated: "Berekend",
  filed: "Ingediend",
};

export default async function BtwPage() {
  const periods = await db
    .select()
    .from(btwPeriods)
    .orderBy(desc(btwPeriods.year), desc(btwPeriods.periodNumber));

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">BTW Aangifte</h1>
        <form
          action={async () => {
            "use server";
            await saveBtwPeriod(currentYear, currentQuarter, "quarterly");
          }}
        >
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Bereken Q{currentQuarter} {currentYear}
          </button>
        </form>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="pb-2">Periode</th>
            <th className="pb-2">Status</th>
            <th className="pb-2 text-right">Omzet 21%</th>
            <th className="pb-2 text-right">Omzet 9%</th>
            <th className="pb-2 text-right">BTW afdracht</th>
            <th className="pb-2 text-right">Voorbelasting</th>
            <th className="pb-2 text-right font-bold">Te betalen</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-3">
                Q{p.periodNumber} {p.year}
              </td>
              <td className="py-3">
                <span
                  className={`rounded px-2 py-1 text-xs ${statusColors[p.status]}`}
                >
                  {statusLabels[p.status]}
                  {p.locked && " (vergrendeld)"}
                </span>
              </td>
              <td className="py-3 text-right font-mono text-sm">
                {(p.omzetHoogCents / 100).toFixed(2)}
              </td>
              <td className="py-3 text-right font-mono text-sm">
                {(p.omzetLaagCents / 100).toFixed(2)}
              </td>
              <td className="py-3 text-right font-mono text-sm">
                {((p.btwHoogCents + p.btwLaagCents) / 100).toFixed(2)}
              </td>
              <td className="py-3 text-right font-mono text-sm">
                {(p.btwInkoopCents / 100).toFixed(2)}
              </td>
              <td className="py-3 text-right font-mono font-bold">
                &euro;{(p.btwTeBetalen / 100).toFixed(2)}
              </td>
              <td className="py-3 text-right">
                {!p.locked && p.status === "calculated" && (
                  <form
                    className="inline"
                    action={async () => {
                      "use server";
                      await lockAndFilePeriod(p.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Indienen
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
          {periods.length === 0 && (
            <tr>
              <td colSpan={8} className="py-8 text-center text-gray-400">
                Nog geen BTW-periodes. Klik op &quot;Bereken&quot; om te
                starten.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-6 rounded border bg-gray-50 p-4 text-sm text-gray-600">
        <p className="font-medium">Handmatig indienen</p>
        <p>
          Na het berekenen van de BTW-aangifte kun je de bedragen overnemen in{" "}
          <strong>Mijn Belastingdienst Zakelijk</strong>. De &quot;Te
          betalen&quot; bedrag is het nettobedrag dat je moet afdragen.
        </p>
      </div>
    </div>
  );
}
