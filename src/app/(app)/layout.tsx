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
      <aside className="flex w-56 flex-col border-r bg-gray-50">
        <div className="border-b p-4">
          <h1 className="text-lg font-bold">Belastingdinst</h1>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded px-3 py-2 text-sm hover:bg-gray-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <p className="mb-2 truncate text-xs text-gray-500">
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
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Uitloggen
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
