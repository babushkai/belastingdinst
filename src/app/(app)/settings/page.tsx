import { getSettings, upsertSettings } from "@/lib/settings/actions";
import { redirect } from "next/navigation";
import { SettingsContent } from "@/components/SettingsContent";

export default async function SettingsPage() {
  const s = await getSettings();

  async function saveAction(formData: FormData) {
    "use server";
    await upsertSettings(formData);
    redirect("/settings");
  }

  return (
    <SettingsContent
      settings={{
        companyName: s?.companyName ?? "",
        btwNumber: s?.btwNumber ?? "",
        kvkNumber: s?.kvkNumber ?? "",
        iban: s?.iban ?? "",
        addressStreet: s?.addressStreet ?? "",
        addressPostcode: s?.addressPostcode ?? "",
        addressCity: s?.addressCity ?? "",
        invoicePrefix: s?.invoicePrefix ?? "F",
        defaultBtwRate: s?.defaultBtwRate ?? 21,
        korActive: s?.korActive ?? false,
      }}
      saveAction={saveAction}
    />
  );
}
