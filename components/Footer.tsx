"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-navy-100 bg-navy-900 text-navy-200">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm">
        <p className="font-semibold text-white">EU Navigator</p>
        <p className="mt-2 max-w-3xl text-navy-300">{t.footer.disclaimer}</p>
        <p className="mt-6 text-navy-400">
          © {new Date().getFullYear()} {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
