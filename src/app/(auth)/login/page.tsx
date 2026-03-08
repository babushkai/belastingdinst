import { signIn } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import {
  checkLoginRateLimit,
  recordLoginAttempt,
} from "@/lib/auth/rate-limiter";
import { headers } from "next/headers";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/dashboard");

  const params = await searchParams;

  async function loginAction(formData: FormData) {
    "use server";

    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const rateLimit = await checkLoginRateLimit(ip);
    if (!rateLimit.allowed) {
      redirect("/login?error=rate_limited");
    }

    try {
      await signIn("credentials", {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        redirectTo: "/dashboard",
      });
    } catch {
      await recordLoginAttempt(ip);
      redirect("/login?error=credentials");
    }
  }

  return <LoginForm error={params.error} registered={params.registered === "true"} loginAction={loginAction} />;
}
