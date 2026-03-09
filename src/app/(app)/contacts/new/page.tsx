import { createContact } from "@/lib/contacts/actions";
import { redirect } from "next/navigation";
import { ContactForm } from "@/components/ContactForm";

export default function NewContactPage() {
  async function handleCreate(formData: FormData) {
    "use server";
    await createContact(formData);
    redirect("/contacts");
  }

  return <ContactForm title="newContact" action={handleCreate} />;
}
