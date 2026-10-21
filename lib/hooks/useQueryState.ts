"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** The page number in ?sida=, 1 when missing or not a positive number. */
export function pageFromParams(params: URLSearchParams | null, key = "sida"): number {
  const n = Number(params?.get(key));
  return Number.isInteger(n) && n > 0 ? n : 1;
}

/** Writes values into the address bar without a new history entry or a
 * scroll, keeping the other parameters. null or "" removes a parameter, so
 * defaults stay out of the URL. */
export function useReplaceQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return useCallback(
    (values: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams?.toString());
      for (const [key, value] of Object.entries(values)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      if (qs === (searchParams?.toString() ?? "")) return;
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );
}
