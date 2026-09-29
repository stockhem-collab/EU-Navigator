"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useNotifications } from "@/components/NotificationsProvider";

// The bell at the top right: unread count, and a panel listing every
// notification (urgent first, then newest). Opening an item marks it read.
export default function NotificationBell() {
  const { t, lang } = useLanguage();
  const nt = t.notifications;
  const { ready, items, unreadCount, isUnread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={nt.bellLabel(unreadCount)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={nt.title}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-navy-500 transition hover:bg-navy-50 hover:text-navy-800"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={nt.title}
          className="absolute right-0 top-11 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-navy-100 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between gap-3 border-b border-navy-100 px-4 py-3">
            <p className="text-sm font-bold text-navy-900">{nt.title}</p>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs font-semibold text-navy-600 hover:text-navy-900">
                {nt.markAllRead}
              </button>
            )}
          </div>
          {!ready ? (
            <p className="px-4 py-6 text-center text-sm text-navy-400">…</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-navy-500">{nt.none}</p>
          ) : (
            <ul className="max-h-[26rem] divide-y divide-navy-50 overflow-y-auto">
              {items.map((n) => {
                const unread = isUnread(n.id);
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                      }}
                      className={`flex gap-3 px-4 py-3 transition hover:bg-navy-50 ${unread ? "bg-gold-50/60" : ""}`}
                    >
                      <span
                        aria-hidden
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          unread ? (n.urgent ? "bg-amber-600" : "bg-navy-700") : "bg-transparent"
                        }`}
                      />
                      <span className="min-w-0">
                        <span className="block text-[11px] font-semibold uppercase text-navy-400">
                          {nt.categoryLabels[n.category]}
                        </span>
                        <span className={`block text-sm ${unread ? "font-semibold text-navy-900" : "text-navy-700"}`}>
                          {lang === "sv" ? n.title_sv : n.title_en}
                        </span>
                        {(lang === "sv" ? n.detail_sv : n.detail_en) && (
                          <span className="block truncate text-xs text-navy-500">{lang === "sv" ? n.detail_sv : n.detail_en}</span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-navy-100 px-4 py-2.5">
            <Link
              href="/installningar/bevakningar"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-navy-600 hover:text-navy-900"
            >
              {nt.settingsLink} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
