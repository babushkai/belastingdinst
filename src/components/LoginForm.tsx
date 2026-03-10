"use client";

import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import Link from "next/link";

export function LoginForm({
  error,
  registered,
  loginAction,
}: {
  error?: string;
  registered?: boolean;
  loginAction: (formData: FormData) => Promise<void>;
}) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-sm space-y-6 border border-black bg-white p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center border border-black text-lg font-bold text-black">
              B
            </div>
            <div>
              <h1 className="text-xl font-bold text-black">
                Belastingdinst
              </h1>
              <p className="text-sm text-gray-600">{t("loginSubtitle")}</p>
            </div>
          </div>
          <LanguageSwitcher className="mt-1 text-gray-500" />
        </div>

        {registered && (
          <div className="border border-green-700 bg-white p-3 text-sm text-green-700">
            {t("loginRegistered")}
          </div>
        )}

        {error && (
          <div className="border border-red-700 bg-white p-3 text-sm text-red-700">
            {error === "rate_limited"
              ? t("loginRateLimited")
              : t("loginInvalidCredentials")}
          </div>
        )}

        <form action={loginAction} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-black"
            >
              {t("loginEmail")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full border border-black bg-white px-2 py-1.5 text-sm text-black placeholder:text-gray-500 focus:outline focus:outline-2 focus:outline-[#0000cc]"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-black"
            >
              {t("loginPassword")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full border border-black bg-white px-2 py-1.5 text-sm text-black placeholder:text-gray-500 focus:outline focus:outline-2 focus:outline-[#0000cc]"
            />
          </div>
          <button
            type="submit"
            className="w-full border border-black bg-black text-white px-4 py-2 text-sm hover:bg-white hover:text-black"
          >
            {t("loginButton")}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          {t("loginNoAccount")}{" "}
          <Link
            href="/signup"
            className="font-medium text-[#0000cc] hover:text-[#000099]"
          >
            {t("loginSignupLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
