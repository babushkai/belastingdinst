import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { eq, ilike, or, desc } from "drizzle-orm";

export async function getContacts() {
  return db
    .select()
    .from(contacts)
    .orderBy(desc(contacts.createdAt));
}

export async function getContactById(id: string) {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, id))
    .limit(1);
  return contact ?? null;
}

export async function searchContacts(query: string) {
  const pattern = `%${query}%`;
  return db
    .select()
    .from(contacts)
    .where(
      or(
        ilike(contacts.companyName, pattern),
        ilike(contacts.contactName, pattern),
        ilike(contacts.email, pattern),
      ),
    )
    .limit(20);
}
