import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import NotificationsProvider from "@/components/NotificationsProvider";
import HashScroller from "@/components/HashScroller";

export const metadata: Metadata = {
  title: "EU Navigator — Från kommunens behov till finansierat projekt",
  description:
    "EU Navigator kopplar samman kommunens investeringsplaner med EU:s finansieringsmöjligheter — AI-driven matchning, ansökningsstöd och rapportering.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className="min-h-screen font-sans antialiased">
        <LanguageProvider>
          <NotificationsProvider>{children}</NotificationsProvider>
          <HashScroller />
        </LanguageProvider>
      </body>
    </html>
  );
}
