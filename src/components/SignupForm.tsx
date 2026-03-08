"use client";

import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import Link from "next/link";

export function SignupForm({
  error,
  loginAction,
}: {
  error?: string;
  loginAction: (formData: FormData) => Promise<void>;
}) {
  const { t } = useI18n();

  const errorMessage = error
    ? t(
        error === "email_taken"
          ? "signupEmailTaken"
          : error === "passwords_mismatch"
            ? "signupPasswordsMismatch"
            : error === "password_too_short"
              ? "signupPasswordTooShort"
              : "signupMissingFields",
      )
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-100 via-primary-50 to-surface-100">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-surface-200 bg-white p-8 shadow-xl shadow-surface-200/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white shadow-md shadow-primary-600/30">
              B
            </div>
            <div>
              <h1 className="text-xl font-bold text-surface-900">
                Belastingdinst
              </h1>
              <p className="text-sm text-surface-500">{t("signupSubtitle")}</p>
            </div>
          </div>
          <LanguageSwitcher className="mt-1 text-surface-400 hover:!bg-surface-100 hover:!text-surface-600" />
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form action={loginAction} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-surface-700"
            >
              {t("signupName")}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-lg border border-surface-300 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-colors placeholder:text-surface-400 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-surface-700"
            >
              {t("loginEmail")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-surface-300 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-colors placeholder:text-surface-400 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-surface-700"
            >
              {t("loginPassword")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-surface-300 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-colors placeholder:text-surface-400 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-surface-700"
            >
              {t("signupConfirmPassword")}
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-surface-300 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-colors placeholder:text-surface-400 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/30 active:scale-[0.98]"
          >
            {t("signupButton")}
          </button>
        </form>

        <p className="text-center text-sm text-surface-500">
          {t("signupHasAccount")}{" "}
          <Link
            href="/login"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            {t("signupLoginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
