/**
 * Obsidian-friendly markdown preprocessing.
 *
 * Converts the two image dialects an Obsidian vault produces into standard
 * markdown whose URLs point at our asset route handler:
 *
 *   ![[diagram.png]]          →  ![diagram.png](/api/asset/<kind>/<slug>/diagram.png)
 *   ![[diagram.png|alt text]] →  ![alt text](/api/asset/<kind>/<slug>/diagram.png)
 *   ![alt](./diagram.png)     →  ![alt](/api/asset/<kind>/<slug>/diagram.png)
 *   ![alt](sub/diagram.png)   →  ![alt](/api/asset/<kind>/<slug>/sub/diagram.png)
 *
 * Absolute URLs (http/https/data) and root-relative paths (/foo) are left
 * untouched, so you can still reference anything already in /public.
 */
import type { Kind } from "./content";

export function assetUrl(kind: Kind, slug: string, relPath: string): string {
  const clean = relPath.replace(/^\.\//, "").replace(/^\/+/, "");
  // Encode each segment but keep the slashes.
  const encoded = clean
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `/api/asset/${kind}/${encodeURIComponent(slug)}/${encoded}`;
}

function isExternal(url: string): boolean {
  return (
    /^(https?:)?\/\//i.test(url) ||
    url.startsWith("data:") ||
    url.startsWith("/")
  );
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i;

export function preprocessMarkdown(
  raw: string,
  kind: Kind,
  slug: string,
): string {
  let out = raw;

  // 1) Obsidian embeds: ![[ target | alt ]]
  out = out.replace(
    /!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g,
    (_m, target: string, alt?: string) => {
      const file = target.trim();
      const label = (alt ?? file.split("/").pop() ?? file).trim();
      if (IMAGE_EXT.test(file)) {
        return `![${label}](${assetUrl(kind, slug, file)})`;
      }
      // Non-image embed — degrade gracefully to plain text.
      return label;
    },
  );

  // 2) Standard markdown images with a relative URL.
  out = out.replace(
    /!\[([^\]]*)\]\(\s*<?([^)>\s]+)>?(?:\s+"[^"]*")?\s*\)/g,
    (match, alt: string, url: string) => {
      if (isExternal(url)) return match;
      return `![${alt}](${assetUrl(kind, slug, url)})`;
    },
  );

  return out;
}
