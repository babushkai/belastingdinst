"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAction(deleteTarget.id);
      setDeleteTarget(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verwijderen mislukt");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader title={t("contacts")}>
        <LinkButton href="/contacts/new">{t("newContact")}</LinkButton>
      </PageHeader>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(contact)}
                    className="text-sm font-medium text-red-500 hover:text-red-600"
                  >
                    {t("deleteAction")}
                  </button>
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

      <ConfirmDialog
        open={!!deleteTarget}
        title={t("deleteAction")}
        message={`${deleteTarget?.companyName ?? deleteTarget?.contactName ?? "Dit contact"} ${t("deleteAction").toLowerCase()}?`}
        confirmLabel={t("deleteAction")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
