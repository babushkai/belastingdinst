"use client";

import { useI18n } from "@/lib/i18n";

interface SettingsData {
  companyName: string;
  btwNumber: string;
  kvkNumber: string;
  iban: string;
  addressStreet: string;
  addressPostcode: string;
  addressCity: string;
  invoicePrefix: string;
  defaultBtwRate: number;
  korActive: boolean;
}

export function SettingsContent({
  settings,
  saveAction,
}: {
  settings: SettingsData;
  saveAction: (formData: FormData) => Promise<void>;
}) {
  const { t } = useI18n();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-surface-900">{t("settings")}</h1>
      <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
        <form action={saveAction} className="space-y-5">
          <Field
            name="companyName"
            label={t("companyName")}
            defaultValue={settings.companyName}
            required
          />
          <Field
            name="btwNumber"
            label={t("btwNumber")}
            defaultValue={settings.btwNumber}
            required
          />
          <Field
            name="kvkNumber"
            label={t("kvkNumber")}
            defaultValue={settings.kvkNumber}
          />
          <Field name="iban" label={t("iban")} defaultValue={settings.iban} />
          <Field
            name="addressStreet"
            label={t("address")}
            defaultValue={settings.addressStreet}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              name="addressPostcode"
              label={t("postcode")}
              defaultValue={settings.addressPostcode}
            />
            <Field
              name="addressCity"
              label={t("city")}
              defaultValue={settings.addressCity}
            />
          </div>
          <Field
            name="invoicePrefix"
            label={t("invoicePrefix")}
            defaultValue={settings.invoicePrefix}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700">
              {t("defaultBtwRate")}
            </label>
            <select
              name="defaultBtwRate"
              defaultValue={settings.defaultBtwRate}
              className="w-full rounded-lg border border-surface-300 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-colors hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            >
              <option value={21}>21%</option>
              <option value={9}>9%</option>
              <option value={0}>0%</option>
            </select>
          </div>
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="korActive"
              name="korActive"
              defaultChecked={settings.korActive}
              className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="korActive" className="text-sm text-surface-700">
              {t("korActive")}
            </label>
          </div>

          <div className="border-t border-surface-100 pt-5">
            <button
              type="submit"
              className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-lg"
            >
              {t("save")}
            </button>
          </div>
        </form>
      </div>
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
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-surface-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-lg border border-surface-300 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-colors placeholder:text-surface-400 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
      />
    </div>
  );
}
