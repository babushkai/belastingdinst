import Link from "next/link";
import { auth, signOut } from "@/lib/auth/config";
import { redirect } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contacts", label: "Relaties" },
  { href: "/invoices", label: "Facturen" },
  { href: "/bank", label: "Bank" },
  { href: "/btw", label: "BTW Aangifte" },
  { href: "/settings", label: "Instellingen" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen">
      <aside className="flex w-56 flex-col border-r border-gray-200 bg-gray-900 text-gray-100 dark:bg-gray-900 dark:text-gray-100">
        <div className="border-b border-gray-700 p-4">
          <h1 className="text-lg font-bold text-white">Belastingdinst</h1>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-700 p-3">
          <p className="mb-2 truncate text-xs text-gray-400">
            {session.user?.email}
          </p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-gray-400 hover:text-white"
            >
              Uitloggen
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-white p-6 text-gray-900 dark:bg-gray-950 dark:text-gray-100">{children}</main>
    </div>
  );
}
