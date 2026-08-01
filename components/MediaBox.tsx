import { site } from "@/lib/site";

/** Sidebar top: a clean framed media image (drop a file at site.mediaSrc). */
export default function MediaBox() {
  return (
    <div className="shrink-0 overflow-hidden rounded-2xl border border-line bg-terminal shadow-frame">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={site.mediaSrc}
        alt="media"
        className="h-[112px] w-full object-cover"
      />
    </div>
  );
}
