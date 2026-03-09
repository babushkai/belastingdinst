"use client";

import { useI18n } from "@/lib/i18n";
import { Field } from "@/components/ui/Field";
import { Button, LinkButton } from "@/components/ui/Button";

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
            <Button type="submit">{t("save")}</Button>
            <LinkButton href="/contacts" variant="secondary">
              {t("cancel")}
            </LinkButton>
          </div>
        </form>
      </div>
    </div>
  );
}
