"use client";

import { useState } from "react";

type Props = {
  value: string;
  className?: string;
  label?: string;
  copiedLabel?: string;
};

export default function CopyButton({
  value,
  className = "",
  label = "copy",
  copiedLabel = "copied",
}: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? copiedLabel : label}
      className={className}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
