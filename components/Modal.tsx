"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * Floating overlay sheet for the `?writeup=slug` modal. Closing pushes back to
 * `/` (client-side, no reload) so the home page underneath keeps its state.
 */
export default function Modal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => router.push("/", { scroll: false }), [router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [close]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 p-0 backdrop-blur-md animate-fade-in sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        className="animate-sheet-in flex h-full w-full max-w-3xl flex-col overflow-hidden bg-card shadow-modal sm:h-[86vh] sm:rounded-2xl sm:border sm:border-line"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="font-mono text-[11px] tracking-widest text-muted">
            ~/writeups
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <span aria-hidden className="text-lg leading-none">
              ×
            </span>
          </button>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
