"use server";

import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function signupAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!name || !email || !password || !confirmPassword) {
    redirect("/signup?error=missing_fields");
  }

  if (password.length < 8) {
    redirect("/signup?error=password_too_short");
  }

  if (password !== confirmPassword) {
    redirect("/signup?error=passwords_mismatch");
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    redirect("/signup?error=email_taken");
  }

  const passwordHash = await hash(password, 12);

  await db.insert(users).values({ email, passwordHash, name });

  redirect("/login?registered=true");
}
