import { createContact } from "@/lib/contacts/actions";
import { redirect } from "next/navigation";

export default function NewContactPage() {
  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Nieuwe relatie</h1>
      <form
        action={async (formData: FormData) => {
          "use server";
          await createContact(formData);
          redirect("/contacts");
        }}
        className="space-y-4"
      >
        <Field name="companyName" label="Bedrijfsnaam" required />
        <Field name="contactName" label="Contactpersoon" />
        <Field name="email" label="Email" type="email" />
        <Field name="btwNumber" label="BTW-nummer" />
        <Field name="kvkNumber" label="KvK-nummer" />
        <Field name="addressStreet" label="Adres" />
        <div className="grid grid-cols-2 gap-4">
          <Field name="addressPostcode" label="Postcode" />
          <Field name="addressCity" label="Plaats" />
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
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded border px-3 py-2"
      />
    </div>
  );
}
