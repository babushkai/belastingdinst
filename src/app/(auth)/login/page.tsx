import { signIn } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import {
  checkLoginRateLimit,
  recordLoginAttempt,
} from "@/lib/auth/rate-limiter";
import { headers } from "next/headers";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/dashboard");

  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8">
        <div>
          <h1 className="text-2xl font-bold">Belastingdinst</h1>
          <p className="text-sm text-gray-500">
            Inloggen om verder te gaan
          </p>
        </div>

        {params.error && (
          <div className="rounded bg-red-50 p-3 text-sm text-red-600">
            {params.error === "rate_limited"
              ? "Te veel inlogpogingen. Probeer het later opnieuw."
              : "Ongeldige inloggegevens."}
          </div>
        )}

        <form
          action={async (formData: FormData) => {
            "use server";

            const headersList = await headers();
            const ip =
              headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
              "unknown";

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
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Wachtwoord
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            Inloggen
          </button>
        </form>
      </div>
    </div>
  );
}
