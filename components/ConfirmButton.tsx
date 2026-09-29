"use client";

import React, { useEffect, useRef, useState } from "react";

// A button that asks for confirmation in the page itself instead of through
// window.confirm. The browser's confirm dialog blocks the main thread for as
// long as it is open, so the whole time spent reading it counts as a frozen
// page (it shows up as a multi-second INP on the button that opened it).
export default function ConfirmButton({
  label,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  className,
  skipConfirm = false,
  danger = false,
  ariaLabel,
}: {
  label: React.ReactNode;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  className?: string;
  /** Run onConfirm straight away — e.g. resetting a field that hasn't
   * been edited, where there is nothing to lose. */
  skipConfirm?: boolean;
  /** Styles the confirm button as a destructive action (removing
   * something). */
  danger?: boolean;
  ariaLabel?: string;
}) {
  const [asking, setAsking] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (asking) confirmRef.current?.focus();
  }, [asking]);

  if (!asking) {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => (skipConfirm ? onConfirm() : setAsking(true))}
        className={className}
      >
        {label}
      </button>
    );
  }

  return (
    <div role="group" aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)} className="flex basis-full flex-wrap items-center gap-2 rounded-md border border-navy-200 bg-navy-50 px-3 py-2">
      <p className="text-xs text-navy-700">{message}</p>
      <button
        ref={confirmRef}
        type="button"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
        className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white ${
          danger ? "bg-amber-700 hover:bg-amber-800" : "bg-green-700 hover:bg-green-800"
        }`}
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={() => setAsking(false)}
        className="rounded-md border border-navy-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-navy-100"
      >
        {cancelLabel}
      </button>
    </div>
  );
}
