"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useNotifications } from "@/components/NotificationsProvider";

// Marks a row (a project, application, report…) that has unread
// notifications — the list-level echo of the bell.
export default function UnreadDot({ entityKey }: { entityKey: string }) {
  const { t } = useLanguage();
  const { unreadForEntity } = useNotifications();
  const n = unreadForEntity(entityKey);
  if (n === 0) return null;
  return (
    <span
      role="img"
      aria-label={t.notifications.unreadMarker(n)}
      title={t.notifications.unreadMarker(n)}
      className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold normal-case text-white"
    >
      {n}
    </span>
  );
}
