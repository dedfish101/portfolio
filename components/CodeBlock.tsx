"use client";

import { useState } from "react";

/**
 * Dark (#111111) code block with a language chip + copy button.
 * Receives the raw code text and language directly from the markdown renderer.
 */
export default function CodeBlock({
  text,
  lang,
}: {
  text: string;
  lang?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* no-op */
    }
  }

  return (
    <div className="group relative my-5 overflow-hidden rounded-xl bg-terminal text-[#e8e8e8] ring-1 ring-white/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="font-mono text-[11px] text-white/50 transition-colors hover:text-white"
          aria-label={copied ? "copied" : "copy code"}
        >
          {copied ? "copied ✓" : "copy"}
        </button>
      </div>
      <pre className="scroll-thin on-dark overflow-x-auto px-4 py-4 font-mono text-[13px] leading-relaxed">
        <code>{text}</code>
      </pre>
    </div>
  );
}
