import { auth, signOut } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex h-screen">
      <Sidebar email={session.user?.email} signOutAction={signOutAction} />
      <main className="flex-1 overflow-y-auto bg-surface-50 px-10 py-8 text-surface-900">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
