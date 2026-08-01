import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DocMeta, Kind } from "@/lib/content";
import { preprocessMarkdown } from "@/lib/mdx";
import { markdownComponents } from "./mdx-components";
import DifficultyPill from "./DifficultyPill";
import WriteupFooter from "./WriteupFooter";

export type WriteupView = { kind: Kind; meta: DocMeta; content: string };

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Full write-up view. Shared by the `?writeup=slug` modal and the standalone
 * `/writeups/[slug]` page so both render identically. Props are serializable so
 * it works on either side of the server/client boundary.
 */
export default function WriteupContent({ writeup }: { writeup: WriteupView }) {
  const { kind, meta, content } = writeup;
  const source = preprocessMarkdown(content, kind, meta.slug);

  return (
    <article className="flex h-full flex-col">
      <header className="border-b border-line px-6 py-6 sm:px-9 sm:py-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {meta.difficulty && <DifficultyPill value={meta.difficulty} />}
          {meta.tags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-[11px] lowercase tracking-tight text-muted"
            >
              #{tag}
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
          {meta.title}
        </h1>
        {meta.date && (
          <p className="mt-2 font-mono text-xs text-muted">
            {formatDate(meta.date)}
          </p>
        )}
      </header>

      <div className="scroll-thin flex-1 overflow-y-auto px-6 py-7 sm:px-9 sm:py-9">
        <div className="wu-prose mx-auto max-w-2xl">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {source}
          </ReactMarkdown>
        </div>
      </div>

      <WriteupFooter kind={kind} slug={meta.slug} raw={content} />
    </article>
  );
}
