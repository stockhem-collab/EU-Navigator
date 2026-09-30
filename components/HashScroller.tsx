"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// A link to a section (/rapportera#upcoming, #tasks-heading, …) lands on
// that section's heading. The browser only jumps once, as the page first
// renders — but most pages fill in from the browser's own storage right
// after, which pushes the section down (or creates it) after the jump. So
// for a short while after arriving, the target is scrolled back to the top
// whenever the page changes, until it settles or the user scrolls
// themselves. The sticky header's height is kept clear by html's
// scroll-padding-top (globals.css).
const SETTLE_MS = 1500;

function scrollToHash(immediate: boolean) {
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (!id) return () => {};
  let cancelled = false;
  const align = () => {
    if (cancelled) return;
    const el = document.getElementById(id);
    if (!el) return;
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const top = el.getBoundingClientRect().top + window.scrollY - padding;
    if (Math.abs(window.scrollY - top) > 2) window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
  };
  const stop = () => {
    cancelled = true;
    observer.disconnect();
    window.clearTimeout(timer);
    for (const type of ["wheel", "touchstart", "keydown", "mousedown"]) window.removeEventListener(type, stop);
  };
  const observer = new MutationObserver(align);
  observer.observe(document.body, { childList: true, subtree: true });
  const timer = window.setTimeout(stop, SETTLE_MS);
  for (const type of ["wheel", "touchstart", "keydown", "mousedown"]) window.addEventListener(type, stop, { passive: true });
  // After an in-page jump the browser is already (smoothly) scrolling
  // there — only later changes to the page need correcting.
  if (immediate) requestAnimationFrame(align);
  return stop;
}

export default function HashScroller() {
  const pathname = usePathname();

  useEffect(() => scrollToHash(true), [pathname]);

  useEffect(() => {
    let stop = () => {};
    const onHashChange = () => {
      stop();
      stop = scrollToHash(false);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      stop();
    };
  }, []);

  return null;
}
