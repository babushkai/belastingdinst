"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { TranslationKey } from "@/lib/i18n";
import {
  IconDashboard,
  IconContacts,
  IconInvoices,
  IconBank,
  IconBtw,
  IconReports,
  IconSettings,
  IconSignOut,
} from "@/components/ui/icons";

const navItems: {
  href: string;
  labelKey: TranslationKey;
  icon: React.FC<{ className?: string }>;
}[] = [
  { href: "/dashboard", labelKey: "navDashboard", icon: IconDashboard },
  { href: "/contacts", labelKey: "navContacts", icon: IconContacts },
  { href: "/invoices", labelKey: "navInvoices", icon: IconInvoices },
  { href: "/bank", labelKey: "navBank", icon: IconBank },
  { href: "/btw", labelKey: "navBtw", icon: IconBtw },
  { href: "/reports/pnl", labelKey: "navReports", icon: IconReports },
  { href: "/settings", labelKey: "navSettings", icon: IconSettings },
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
    <aside className="flex w-52 flex-col border-r border-black bg-white text-black print:hidden">
      {/* Brand */}
      <div className="flex items-center gap-2 border-b border-black px-4 py-3">
        <span className="flex h-7 w-7 items-center justify-center border border-black text-sm font-bold">
          B
        </span>
        <span className="text-sm font-bold uppercase tracking-wider">
          Belastingdinst
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm no-underline ${
                isActive
                  ? "border-l-2 border-black pl-2.5 font-bold text-black"
                  : "text-gray-600 hover:bg-gray-100 hover:text-black"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-black px-3 py-2">
        <div className="flex items-center justify-between">
          <p className="min-w-0 truncate text-xs text-gray-600">
            {email}
          </p>
          <LanguageSwitcher className="ml-2" />
        </div>
        <form action={signOutAction} className="mt-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 text-xs text-black underline hover:text-[#0000cc]"
          >
            <IconSignOut className="h-3.5 w-3.5" />
            {t("signOut")}
          </button>
        </form>
      </div>
    </aside>
  );
}
