"use client";

import { useEffect, useState } from "react";

/**
 * Dark/light toggle. Flips the `.dark` class on <html> (which swaps every CSS
 * variable) and persists the choice to localStorage. Initial class is set by
 * the inline no-flash script in the root layout, so we just read it on mount.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    // Suppress transitions for the swap so var-driven colours repaint instantly.
    el.classList.add("theme-switching");
    el.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage blocked — theme still applies for this session */
    }
    requestAnimationFrame(() =>
      requestAnimationFrame(() => el.classList.remove("theme-switching")),
    );
    setDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
      className="flex h-5 w-5 items-center justify-center rounded text-white/45 transition-colors hover:text-white"
    >
      {dark ? (
        // sun
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // moon
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
