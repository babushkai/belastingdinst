"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { TranslationKey } from "@/lib/i18n";

const navItems: { href: string; labelKey: TranslationKey; icon: string }[] = [
  { href: "/dashboard", labelKey: "navDashboard", icon: "📊" },
  { href: "/contacts", labelKey: "navContacts", icon: "👥" },
  { href: "/invoices", labelKey: "navInvoices", icon: "📄" },
  { href: "/bank", labelKey: "navBank", icon: "🏦" },
  { href: "/btw", labelKey: "navBtw", icon: "🧾" },
  { href: "/settings", labelKey: "navSettings", icon: "⚙️" },
];

export function Sidebar({
  email,
  signOutAction,
}: {
  email: string | undefined | null;
  signOutAction: () => Promise<void>;
}) {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-col bg-surface-950 text-surface-300">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-surface-800 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
          B
        </div>
        <span className="text-base font-semibold tracking-tight text-white">
          Belastingdinst
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-600/15 text-primary-300"
                  : "text-surface-400 hover:bg-surface-800/60 hover:text-surface-200"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-surface-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-surface-400">
              {email}
            </p>
          </div>
          <LanguageSwitcher className="ml-2 text-surface-500 hover:!bg-surface-800 hover:!text-surface-300" />
        </div>
        <form action={signOutAction} className="mt-2">
          <button
            type="submit"
            className="text-xs font-medium text-surface-500 transition-colors hover:text-surface-300"
          >
            {t("signOut")}
          </button>
        </form>
      </div>
    </aside>
  );
}
