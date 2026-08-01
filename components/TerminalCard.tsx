import Link from "next/link";
import { site } from "@/lib/site";

/** Left-column top: the `$ whoami && cat ~/about` terminal block. */
export default function TerminalCard() {
  return (
    <div className="flex shrink-0 flex-col overflow-hidden rounded-2xl bg-terminal text-[#e8e8e8] shadow-frame ring-1 ring-black/20">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-[11px] text-white/35">bash — ~/about</span>
      </div>

      <div className="min-h-0 flex-1 px-5 py-3 font-mono text-[13px] leading-snug sm:px-7 sm:py-4">
        <p className="text-white/45">
          <span className="text-[#28c840]">$</span> whoami{" "}
          <span className="text-white/30">&amp;&amp;</span> cat ~/about
        </p>

        <h1 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
          {site.name}{" "}
          <span className="text-sm font-normal text-white/50">· {site.role}</span>
        </h1>
        <p className="mt-1.5 max-w-xl text-white/70">{site.bio}</p>

        {/* core skills */}
        <p className="mt-3 text-white/40"># core skills</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {site.skills.map((s) => (
            <span
              key={s}
              className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/75"
            >
              {s}
            </span>
          ))}
        </div>

        {/* certification */}
        <p className="mt-3 text-white/40"># certification</p>
        <p className="mt-1 text-white/80">
          <span className="text-[#febc2e]">◆</span> {site.cert.label}{" "}
          <span className="text-white/40">({site.cert.year})</span>
        </p>
      </div>

      {/* Contact CTA inside the terminal */}
      <Link
        href={site.contactHref}
        className="group flex shrink-0 items-center justify-between border-t border-white/10 bg-white/[0.04] px-5 py-3 font-mono text-sm transition-colors hover:bg-white/[0.08] sm:px-7"
      >
        <span className="text-white/70">wanna talk?</span>
        <span className="flex items-center gap-2 text-white">
          <span className="text-white/40">-&gt;</span>
          <span className="underline decoration-white/30 underline-offset-4 group-hover:decoration-white">
            [contact ↗]
          </span>
        </span>
      </Link>
    </div>
  );
}
