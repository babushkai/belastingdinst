"use client";

import { useI18n } from "@/lib/i18n";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "nl" ? "en" : "nl")}
      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-surface-700 ${className}`}
      title={locale === "nl" ? "Switch to English" : "Wissel naar Nederlands"}
    >
      {locale === "nl" ? "EN" : "NL"}
    </button>
  );
}
