import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { signupAction } from "@/lib/auth/signup";
import { SignupForm } from "@/components/SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/dashboard");

  const params = await searchParams;

  return <SignupForm error={params.error} loginAction={signupAction} />;
}
