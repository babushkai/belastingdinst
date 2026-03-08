"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

interface Contact {
  id: string;
  companyName: string | null;
  contactName: string | null;
  email: string | null;
  addressCity: string | null;
}

export function ContactsContent({
  contacts,
  deleteAction,
}: {
  contacts: Contact[];
  deleteAction: (id: string) => Promise<void>;
}) {
  const { t } = useI18n();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">{t("contacts")}</h1>
        <Link
          href="/contacts/new"
          className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-lg"
        >
          {t("newContact")}
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
              <th className="px-5 py-3">{t("companyName")}</th>
              <th className="px-5 py-3">{t("contactPerson")}</th>
              <th className="px-5 py-3">{t("email")}</th>
              <th className="px-5 py-3">{t("city")}</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {contacts.map((contact) => (
              <tr key={contact.id} className="transition-colors hover:bg-surface-50">
                <td className="px-5 py-3.5 font-medium text-surface-900">{contact.companyName}</td>
                <td className="px-5 py-3.5 text-surface-700">{contact.contactName}</td>
                <td className="px-5 py-3.5 text-sm text-surface-500">{contact.email}</td>
                <td className="px-5 py-3.5 text-sm text-surface-600">{contact.addressCity}</td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/contacts/${contact.id}/edit`}
                    className="mr-3 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {t("edit")}
                  </Link>
                  <form
                    className="inline"
                    action={async () => {
                      await deleteAction(contact.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-sm font-medium text-red-500 hover:text-red-600"
                    >
                      {t("deleteAction")}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-surface-400">
                  {t("contactsEmpty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
