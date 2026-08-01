"use client";

import { useState } from "react";
import Link from "next/link";
import type { Kind } from "@/lib/content";
import DifficultyPill from "./DifficultyPill";

export type ListItem = {
  kind: Kind;
  slug: string;
  title: string;
  date: string;
  tags: string[];
  difficulty?: string;
};

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * "Knowledge Base" — dual-tab markdown lists (writeups / notes) that fill the
 * left column with an independent, custom-scrollbar scroll region.
 */
export default function KnowledgeBase({
  writeups,
  notes,
}: {
  writeups: ListItem[];
  notes: ListItem[];
}) {
  const [tab, setTab] = useState<Kind>("writeup");
  const items = tab === "writeup" ? writeups : notes;

  const tabBtn = (active: boolean) =>
    `rounded-md px-3 py-1 font-mono text-xs transition-colors ${
      active ? "bg-accent text-white" : "text-muted hover:text-ink"
    }`;

  return (
    <section className="mt-4 flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex shrink-0 items-center justify-between px-1">
        <div className="flex items-center gap-1 rounded-lg bg-surface p-1">
          <button type="button" onClick={() => setTab("writeup")} className={tabBtn(tab === "writeup")}>
            [ CTF Writeups ]
          </button>
          <button type="button" onClick={() => setTab("note")} className={tabBtn(tab === "note")}>
            [ Cyber Notes ]
          </button>
        </div>
        <span className="font-mono text-xs text-muted">
          {String(items.length).padStart(2, "0")} total
        </span>
      </div>

      {/* Independently scrolling list — fills remaining height */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-frame">
        {items.length === 0 ? (
          <p className="px-6 py-10 text-center font-mono text-sm text-muted">
            nothing here yet — drop a .md file in{" "}
            <code>/content/{tab === "writeup" ? "writeups" : "notes"}</code>
          </p>
        ) : (
          <ul className="scrollbar-custom min-h-0 flex-1 overflow-y-auto">
            {items.map((it, i) => (
              <li key={it.slug}>
                <Link
                  href={`/?${it.kind}=${it.slug}`}
                  scroll={false}
                  className="group flex items-center gap-4 border-b border-line px-5 py-3.5 transition-colors last:border-b-0 hover:bg-surface"
                >
                  <span className="font-mono text-sm tabular-nums text-muted group-hover:text-ink">
                    {String(items.length - i).padStart(2, "0")}
                  </span>
                  <span className="h-8 w-px shrink-0 bg-line" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium tracking-tight text-ink">
                        {it.title}
                      </span>
                      {it.difficulty ? (
                        <DifficultyPill value={it.difficulty} />
                      ) : it.tags[0] ? (
                        <span className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted">
                          [{it.tags[0]}]
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {it.date && (
                        <span className="font-mono text-[11px] text-muted">
                          {formatDate(it.date)}
                        </span>
                      )}
                      {it.tags.slice(0, 3).map((t) => (
                        <span key={t} className="font-mono text-[11px] text-muted">
                          #{t}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="font-mono text-muted opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    ↗
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
