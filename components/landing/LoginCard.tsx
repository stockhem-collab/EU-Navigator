"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { safeNextPath } from "@/lib/auth/shared";

// The login on the start page. The password is checked on the server
// (/api/login); on success the user goes to Översikt, or back to the page
// they were trying to open (?next=, set by middleware.ts).
export default function LoginCard() {
  const { t } = useLanguage();
  const l = t.login;
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      if (response.ok) {
        // A full navigation, so the new session cookie is sent with it.
        window.location.assign(safeNextPath(searchParams.get("next")));
        return;
      }
      setError(response.status === 401 ? l.errorInvalid : response.status === 503 ? l.errorNotConfigured : l.errorGeneric);
    } catch {
      setError(l.errorGeneric);
    }
    setBusy(false);
  };

  const inputClass =
    "mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500";

  return (
    <form
      id="login"
      onSubmit={submit}
      aria-labelledby="login-title"
      className="w-full rounded-2xl bg-white p-6 text-navy-900 shadow-xl"
    >
      <h2 id="login-title" className="text-xl font-bold">
        {l.title}
      </h2>
      <p className="mt-1 text-sm text-navy-500">{l.subtitle}</p>
      <label htmlFor="login-email" className="mt-5 block text-sm font-semibold text-navy-800">
        {l.email}
      </label>
      <input
        id="login-email"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClass}
      />
      <label htmlFor="login-password" className="mt-4 block text-sm font-semibold text-navy-800">
        {l.password}
      </label>
      <input
        id="login-password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputClass}
      />
      <label className="mt-4 flex items-center gap-2 text-sm text-navy-700">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        {l.remember}
      </label>
      {error && (
        <p role="alert" className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mt-5 w-full rounded-md bg-navy-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-700 disabled:opacity-60"
      >
        {busy ? l.submitting : l.submit}
      </button>
    </form>
  );
}
