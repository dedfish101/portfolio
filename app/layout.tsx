import type { Metadata } from "next";
import type { ReactNode } from "react";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: `${site.name} — write-ups`,
  description: site.tagline,
  // Tab icon comes from app/icon.svg + app/favicon.ico (Next's file
  // convention), which serves them with a content hash so browsers pick up
  // changes instead of holding a stale cached favicon. No `icons` entry
  // needed here — declaring one would emit a second, unhashed <link>.
};

// Runs before first paint to apply the saved theme (or the OS preference),
// avoiding a light-mode flash on dark-theme loads.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
