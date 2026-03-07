import Link from "next/link";
import { getContacts } from "@/lib/contacts/queries";
import { deleteContact } from "@/lib/contacts/actions";

export default async function ContactsPage() {
  const allContacts = await getContacts();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relaties</h1>
        <Link
          href="/contacts/new"
          className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Nieuwe relatie
        </Link>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="pb-2">Bedrijfsnaam</th>
            <th className="pb-2">Contact</th>
            <th className="pb-2">Email</th>
            <th className="pb-2">Plaats</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {allContacts.map((contact) => (
            <tr key={contact.id} className="border-b">
              <td className="py-3">{contact.companyName}</td>
              <td className="py-3">{contact.contactName}</td>
              <td className="py-3 text-sm text-gray-500">{contact.email}</td>
              <td className="py-3 text-sm">{contact.addressCity}</td>
              <td className="py-3 text-right">
                <Link
                  href={`/contacts/${contact.id}/edit`}
                  className="mr-3 text-sm text-blue-600 hover:underline"
                >
                  Bewerken
                </Link>
                <form
                  className="inline"
                  action={async () => {
                    "use server";
                    await deleteContact(contact.id);
                  }}
                >
                  <button
                    type="submit"
                    className="text-sm text-red-600 hover:underline"
                  >
                    Verwijderen
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {allContacts.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-gray-400">
                Nog geen relaties. Maak een nieuwe relatie aan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
