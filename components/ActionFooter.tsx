import { site } from "@/lib/site";
import { ICONS } from "./SocialIcons";

/** Sidebar bottom: prominent Resume button + icon-only social row. */
export default function ActionFooter() {
  return (
    <div className="shrink-0 space-y-3">
      <a
        href={site.resumeHref}
        target="_blank"
        rel="noreferrer noopener"
        className="group flex items-center justify-between rounded-2xl bg-accent px-4 py-3 text-white shadow-frame transition-colors hover:opacity-90"
      >
        <span className="font-mono text-sm font-semibold">View / Download Resume PDF</span>
        <span aria-hidden className="text-lg transition-transform group-hover:translate-x-0.5">
          ↗
        </span>
      </a>

      <nav className="flex items-center justify-center gap-2">
        {site.links.map((l) => {
          const Icon = ICONS[l.icon];
          return (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={l.label}
              title={l.label}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-card text-muted transition-colors hover:border-ink hover:text-ink"
            >
              {Icon ? <Icon className="h-[18px] w-[18px]" /> : null}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
