import { getContactById } from "@/lib/contacts/queries";
import { updateContact } from "@/lib/contacts/actions";
import { notFound, redirect } from "next/navigation";
import { ContactForm } from "@/components/ContactForm";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await getContactById(id);
  if (!contact) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateContact(id, formData);
    redirect("/contacts");
  }

  return (
    <ContactForm
      title="editContact"
      action={handleUpdate}
      defaults={{
        companyName: contact.companyName ?? "",
        contactName: contact.contactName ?? "",
        email: contact.email ?? "",
        btwNumber: contact.btwNumber ?? "",
        kvkNumber: contact.kvkNumber ?? "",
        iban: contact.iban ?? "",
        addressStreet: contact.addressStreet ?? "",
        addressPostcode: contact.addressPostcode ?? "",
        addressCity: contact.addressCity ?? "",
      }}
    />
  );
}
