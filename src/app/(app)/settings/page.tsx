import { getSettings, upsertSettings } from "@/lib/settings/actions";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const s = await getSettings();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Instellingen</h1>
      <form
        action={async (formData: FormData) => {
          "use server";
          await upsertSettings(formData);
          redirect("/settings");
        }}
        className="space-y-4"
      >
        <Field
          name="companyName"
          label="Bedrijfsnaam"
          defaultValue={s?.companyName ?? ""}
          required
        />
        <Field
          name="btwNumber"
          label="BTW-nummer"
          defaultValue={s?.btwNumber ?? ""}
          required
        />
        <Field
          name="kvkNumber"
          label="KvK-nummer"
          defaultValue={s?.kvkNumber ?? ""}
        />
        <Field name="iban" label="IBAN" defaultValue={s?.iban ?? ""} />
        <Field
          name="addressStreet"
          label="Adres"
          defaultValue={s?.addressStreet ?? ""}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            name="addressPostcode"
            label="Postcode"
            defaultValue={s?.addressPostcode ?? ""}
          />
          <Field
            name="addressCity"
            label="Plaats"
            defaultValue={s?.addressCity ?? ""}
          />
        </div>
        <Field
          name="invoicePrefix"
          label="Factuur prefix"
          defaultValue={s?.invoicePrefix ?? "F"}
        />
        <div>
          <label className="block text-sm font-medium">Standaard BTW-tarief</label>
          <select
            name="defaultBtwRate"
            defaultValue={s?.defaultBtwRate ?? 21}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            <option value={21}>21%</option>
            <option value={9}>9%</option>
            <option value={0}>0%</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="korActive"
            name="korActive"
            defaultChecked={s?.korActive ?? false}
          />
          <label htmlFor="korActive" className="text-sm">
            KOR (Kleineondernemersregeling) actief
          </label>
        </div>

        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Opslaan
        </button>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue = "",
  required = false,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="mt-1 w-full rounded border px-3 py-2"
      />
    </div>
  );
}
