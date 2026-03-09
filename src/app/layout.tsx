import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Belastingdinst - Accounting",
  description: "Self-hosted accounting and VAT returns for freelancers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className="bg-surface-50 text-surface-900 antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
