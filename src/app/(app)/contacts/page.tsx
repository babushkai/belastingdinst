import { getContacts } from "@/lib/contacts/queries";
import { deleteContact } from "@/lib/contacts/actions";
import { ContactsContent } from "@/components/ContactsContent";

export default async function ContactsPage() {
  const allContacts = await getContacts();

  async function handleDelete(id: string) {
    "use server";
    await deleteContact(id);
  }

  return (
    <ContactsContent
      contacts={allContacts.map((c) => ({
        id: c.id,
        companyName: c.companyName,
        contactName: c.contactName,
        email: c.email,
        addressCity: c.addressCity,
      }))}
      deleteAction={handleDelete}
    />
  );
}
