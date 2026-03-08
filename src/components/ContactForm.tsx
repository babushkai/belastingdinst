"use client";

import { useI18n } from "@/lib/i18n";

interface ContactFormProps {
  title: "newContact" | "editContact";
  action: (formData: FormData) => Promise<void>;
  defaults?: {
    companyName?: string;
    contactName?: string;
    email?: string;
    btwNumber?: string;
    kvkNumber?: string;
    addressStreet?: string;
    addressPostcode?: string;
    addressCity?: string;
  };
}

export function ContactForm({ title, action, defaults = {} }: ContactFormProps) {
  const { t } = useI18n();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-surface-900">{t(title)}</h1>
      <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
        <form action={action} className="space-y-5">
          <Field
            name="companyName"
            label={t("companyName")}
            defaultValue={defaults.companyName ?? ""}
            required={title === "newContact"}
          />
          <Field
            name="contactName"
            label={t("contactPerson")}
            defaultValue={defaults.contactName ?? ""}
          />
          <Field
            name="email"
            label={t("email")}
            type="email"
            defaultValue={defaults.email ?? ""}
          />
          <Field
            name="btwNumber"
            label={t("btwNumber")}
            defaultValue={defaults.btwNumber ?? ""}
          />
          <Field
            name="kvkNumber"
            label={t("kvkNumber")}
            defaultValue={defaults.kvkNumber ?? ""}
          />
          <Field
            name="addressStreet"
            label={t("address")}
            defaultValue={defaults.addressStreet ?? ""}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              name="addressPostcode"
              label={t("postcode")}
              defaultValue={defaults.addressPostcode ?? ""}
            />
            <Field
              name="addressCity"
              label={t("city")}
              defaultValue={defaults.addressCity ?? ""}
            />
          </div>

          <div className="flex gap-3 border-t border-surface-100 pt-5">
            <button
              type="submit"
              className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-lg"
            >
              {t("save")}
            </button>
            <a
              href="/contacts"
              className="inline-flex items-center rounded-lg border border-surface-300 bg-white px-5 py-2.5 text-sm font-medium text-surface-700 shadow-sm transition-colors hover:bg-surface-50"
            >
              {t("cancel")}
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  defaultValue = "",
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-surface-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-surface-300 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-colors placeholder:text-surface-400 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
      />
    </div>
  );
}
