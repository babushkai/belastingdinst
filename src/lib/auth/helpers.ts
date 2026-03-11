import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function getDefaultUserId(): Promise<string> {
  const [user] = await db.select({ id: users.id }).from(users).limit(1);
  if (!user) throw new Error("No user found");
  return user.id;
}
