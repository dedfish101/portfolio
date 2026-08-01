import Taskbar from "@/components/Taskbar";
import Modal from "@/components/Modal";
import WriteupContent from "@/components/WriteupContent";
import TerminalCard from "@/components/TerminalCard";
import KnowledgeBase, { type ListItem } from "@/components/KnowledgeBase";
import Sidebar from "@/components/Sidebar";
import { getAll, getBySlug, type Doc, type Kind } from "@/lib/content";
import { site } from "@/lib/site";

// Rendered per request: reads content/writeups + content/notes fresh, and lets
// `?writeup=slug` / `?note=slug` render its modal on the server (direct loads too).
export const dynamic = "force-dynamic";

const toItem = (d: Doc): ListItem => ({
  kind: d.kind,
  slug: d.meta.slug,
  title: d.meta.title,
  date: d.meta.date,
  tags: d.meta.tags,
  difficulty: d.meta.difficulty,
});

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ writeup?: string; note?: string }>;
}) {
  const writeups = getAll("writeup");
  const notes = getAll("note");

  const sp = await searchParams;
  const openKind: Kind | null = sp.writeup ? "writeup" : sp.note ? "note" : null;
  const openSlug = sp.writeup ?? sp.note;
  const open = openKind && openSlug ? getBySlug(openKind, openSlug) : null;

  return (
    <main className="flex min-h-screen justify-center bg-canvas p-3 sm:p-5 lg:h-screen lg:overflow-hidden">
      {/* Centered white card; the outer window never scrolls. */}
      <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-line bg-card p-3 shadow-frame sm:p-4">
        <Taskbar />
        <BrandRow />

        {/* Asymmetrical 65 / 35 grid. Scrolls on mobile, single-screen on desktop. */}
        <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto lg:grid-cols-[65fr_35fr] lg:overflow-hidden">
          {/* Left column: terminal + knowledge base */}
          <div className="flex min-h-0 flex-col">
            <TerminalCard />
            <KnowledgeBase writeups={writeups.map(toItem)} notes={notes.map(toItem)} />
          </div>

          {/* Right column: media · music · game · resume/socials */}
          <Sidebar />
        </div>
      </div>

      {open && openKind && (
        <Modal>
          <WriteupContent writeup={{ kind: openKind, meta: open.meta, content: open.content }} />
        </Modal>
      )}
    </main>
  );
}

function BrandRow() {
  return (
    <header className="mt-3 flex shrink-0 items-center justify-between px-1">
      <div className="flex items-center gap-2 font-mono text-sm">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-xs text-white">
          {site.name.charAt(0).toUpperCase()}
        </span>
        <span className="font-medium text-ink">{site.name}</span>
        <span className="text-muted">/ knowledge base</span>
      </div>
      <span className="hidden font-mono text-xs text-muted sm:inline">{site.role}</span>
    </header>
  );
}
