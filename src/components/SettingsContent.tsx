"use client";

import { useTransition } from "react";
import { useI18n } from "@/lib/i18n";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

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
  const [pending, startTransition] = useTransition();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-black">{t("settings")}</h1>
      <div className="border border-black bg-white p-6">
        <form
          action={(formData) => startTransition(() => saveAction(formData))}
          className="space-y-5"
        >
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
            <label className="mb-1.5 block text-sm font-medium text-black">
              {t("defaultBtwRate")}
            </label>
            <select
              name="defaultBtwRate"
              defaultValue={settings.defaultBtwRate}
              className={inputClass}
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
              className="h-4 w-4 border-black text-black"
            />
            <label htmlFor="korActive" className="text-sm text-black">
              {t("korActive")}
            </label>
          </div>

          <div className="border-t border-gray-300 pt-5">
            <Button type="submit" loading={pending}>
              {t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
