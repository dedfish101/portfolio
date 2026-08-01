import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="rounded-2xl border border-line bg-card px-8 py-10 text-center shadow-frame">
        <p className="font-mono text-sm text-muted">$ cat writeup</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">404 — not found</h1>
        <p className="mt-2 text-sm text-muted">
          That write-up doesn&apos;t exist (or hasn&apos;t been published yet).
        </p>
        <Link
          href="/"
          className="mt-5 inline-block font-mono text-xs text-ink underline underline-offset-4"
        >
          ← back home
        </Link>
      </div>
    </main>
  );
}
