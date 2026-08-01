import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import WriteupContent from "@/components/WriteupContent";
import { getBySlug, getSlugs } from "@/lib/content";

export function generateStaticParams() {
  return getSlugs("writeup").map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const writeup = getBySlug("writeup", slug);
  if (!writeup) return { title: "not found" };
  return {
    title: writeup.meta.title,
    description: writeup.meta.summary ?? writeup.meta.tags.join(", "),
  };
}

/**
 * Standalone page — served on direct navigation / refresh / share, and to
 * crawlers. On in-app clicks the intercepting route shows the modal instead.
 */
export default async function WriteupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const writeup = getBySlug("writeup", slug);
  if (!writeup) notFound();

  return (
    <main className="min-h-screen bg-canvas px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 font-mono text-xs text-muted transition-colors hover:text-ink"
        >
          <span aria-hidden>←</span> back to all write-ups
        </Link>
        <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-frame">
          <WriteupContent
            writeup={{
              kind: "writeup",
              meta: writeup.meta,
              content: writeup.content,
            }}
          />
        </div>
      </div>
    </main>
  );
}
