import type { Metadata } from "next";
import { JetBrains_Mono, Oswald, Space_Grotesk } from "next/font/google";

import { getCurrentUser } from "@/lib/auth";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { TopNav } from "@/components/top-nav";
import { APP_NAME } from "@/lib/utils";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-condensed",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: `${APP_NAME} | Marketplace de coaching sportif`,
  description:
    "100T est une marketplace française de coaching sportif par abonnement entre abonnés et coachs professionnels.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="fr" className="dark">
      <body className={`${spaceGrotesk.variable} ${oswald.variable} ${jetBrainsMono.variable}`}>
        <TopNav />
        <main>{children}</main>
        <MobileBottomNav role={user?.role ?? null} />
      </body>
    </html>
  );
}
