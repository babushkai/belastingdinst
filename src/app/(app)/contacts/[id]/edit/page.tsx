import { getContactById } from "@/lib/contacts/queries";
import { updateContact } from "@/lib/contacts/actions";
import { notFound, redirect } from "next/navigation";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await getContactById(id);
  if (!contact) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Relatie bewerken</h1>
      <form
        action={async (formData: FormData) => {
          "use server";
          await updateContact(id, formData);
          redirect("/contacts");
        }}
        className="space-y-4"
      >
        <Field
          name="companyName"
          label="Bedrijfsnaam"
          defaultValue={contact.companyName ?? ""}
        />
        <Field
          name="contactName"
          label="Contactpersoon"
          defaultValue={contact.contactName ?? ""}
        />
        <Field
          name="email"
          label="Email"
          type="email"
          defaultValue={contact.email ?? ""}
        />
        <Field
          name="btwNumber"
          label="BTW-nummer"
          defaultValue={contact.btwNumber ?? ""}
        />
        <Field
          name="kvkNumber"
          label="KvK-nummer"
          defaultValue={contact.kvkNumber ?? ""}
        />
        <Field
          name="addressStreet"
          label="Adres"
          defaultValue={contact.addressStreet ?? ""}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            name="addressPostcode"
            label="Postcode"
            defaultValue={contact.addressPostcode ?? ""}
          />
          <Field
            name="addressCity"
            label="Plaats"
            defaultValue={contact.addressCity ?? ""}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Opslaan
          </button>
          <a href="/contacts" className="rounded border px-4 py-2 text-sm">
            Annuleren
          </a>
        </div>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue = "",
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded border px-3 py-2"
      />
    </div>
  );
}
