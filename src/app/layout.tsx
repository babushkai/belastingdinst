import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Belastingdinst - Boekhouding",
  description: "Zelfgehoste boekhouding en BTW-aangifte voor ZZP'ers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
