"use client";

import { useI18n } from "@/lib/i18n";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "nl" ? "en" : "nl")}
      className={`border border-black px-2 py-0.5 text-xs hover:bg-black hover:text-white ${className}`}
      title={locale === "nl" ? "Switch to English" : "Wissel naar Nederlands"}
    >
      {locale === "nl" ? "EN" : "NL"}
    </button>
  );
}
