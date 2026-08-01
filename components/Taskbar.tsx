"use client";

import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

/** Minimal status bar: OS · STATUS · live UTC clock · theme toggle. */
export default function Taskbar() {
  const [utc, setUtc] = useState("--:--:--");

  useEffect(() => {
    const tick = () =>
      setUtc(
        new Date().toLocaleTimeString("en-GB", {
          hour12: false,
          timeZone: "UTC",
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const sep = <span className="text-white/20">|</span>;

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-accent px-3 py-1.5 font-mono text-[11px] text-white/70">
      <span className="text-white/45">
        OS: <span className="text-white/80">Linux</span>
      </span>

      <span className="flex items-center gap-2">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#28c840] shadow-[0_0_6px_#28c840]" />
          <span className="text-white/45">STATUS:</span>
          <span className="text-white">OPTIMAL</span>
        </span>
        {sep}
        <span>
          <span className="text-white/45">UTC</span>{" "}
          <span className="tabular-nums text-white">{utc}</span>
        </span>
        {sep}
        <ThemeToggle />
      </span>
    </div>
  );
}
