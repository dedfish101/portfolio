/**
 * Crisp monochrome social marks — `currentColor` so they inherit hover state.
 * Simple, recognizable paths kept minimal to match the site aesthetic.
 */
type IconProps = { className?: string };

export function GithubIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
    </svg>
  );
}

export function LinkedinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.24 2.25h3.31l-7.23 8.26L22.85 21.75h-6.66l-5.22-6.82-5.97 6.82H1.69l7.73-8.83L1.15 2.25h6.83l4.71 6.23 5.55-6.23zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64z" />
    </svg>
  );
}

export function TryHackMeIcon({ className }: IconProps) {
  // Simplified shield mark (THM's motif) — recognizable without their exact art.
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 1.5 3 4.8v6.06c0 5.06 3.55 9.79 9 11.64 5.45-1.85 9-6.58 9-11.64V4.8l-9-3.3zm0 2.13 7 2.57v5.16c0 3.94-2.62 7.65-7 9.36-4.38-1.71-7-5.42-7-9.36V6.2l7-2.57zm-1 4.12v3H8l5 5v-3h3l-5-5z" />
    </svg>
  );
}

export const ICONS: Record<string, (p: IconProps) => React.JSX.Element> = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  x: XIcon,
  tryhackme: TryHackMeIcon,
};
