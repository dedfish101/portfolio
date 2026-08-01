"use client";

import { useState } from "react";
import type { Kind } from "@/lib/content";

/** Sticky footer bar with quick actions: copy link + copy markdown source. */
export default function WriteupFooter({
  kind,
  slug,
  raw,
}: {
  kind: Kind;
  slug: string;
  raw: string;
}) {
  const [done, setDone] = useState<"" | "link" | "md">("");

  function flash(which: "link" | "md") {
    setDone(which);
    setTimeout(() => setDone(""), 1400);
  }

  async function copyLink() {
    // Shareable deep link that reopens the modal (works for both collections).
    const path = `/?${kind}=${encodeURIComponent(slug)}`;
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${path}`
        : path;
    try {
      await navigator.clipboard.writeText(url);
      flash("link");
    } catch {
      /* no-op */
    }
  }

  async function copyMd() {
    try {
      await navigator.clipboard.writeText(raw);
      flash("md");
    } catch {
      /* no-op */
    }
  }

  const btn =
    "font-mono text-xs text-muted transition-colors hover:text-ink flex items-center gap-1.5";

  return (
    <footer className="flex items-center gap-5 border-t border-line bg-surface px-6 py-3.5 sm:px-9">
      <button type="button" onClick={copyLink} className={btn}>
        <span aria-hidden>🔗</span>
        {done === "link" ? "link copied ✓" : "copy link"}
      </button>
      <button type="button" onClick={copyMd} className={btn}>
        <span aria-hidden>⌘</span>
        {done === "md" ? "markdown copied ✓" : "copy md"}
      </button>
    </footer>
  );
}
