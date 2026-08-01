"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

/* ------------------------------------------------------------------ */
/*  Minimalist lofi player. Charcoal waveform doubles as a seek bar.    */
/*  Attempts autoplay; if the browser blocks it, starts on the first    */
/*  user gesture. No libraries — one <audio> element, driven by refs.   */
/* ------------------------------------------------------------------ */

// Deterministic bar heights (no Math.random → no hydration mismatch).
const BARS = Array.from({ length: 34 }, (_, i) =>
  26 + Math.round((Math.abs(Math.sin(i * 1.7) + Math.sin(i * 0.5)) / 2) * 74),
);

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d={path} />
    </svg>
  );
}
const PREV = "M6 6h2v12H6V6zm3.5 6 8.5 6V6l-8.5 6z";
const NEXT = "M16 6h2v12h-2V6zM6 6l8.5 6L6 18V6z";
const PLAY = "M8 5v14l11-7L8 5z";
const PAUSE = "M6 5h4v14H6V5zm8 0h4v14h-4V5z";

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const mounted = useRef(false);
  const tracks = site.tracks;

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const playingRef = useRef(false);
  playingRef.current = playing;

  const track = tracks[index];

  const play = useCallback(async () => {
    try {
      await audioRef.current?.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + tracks.length) % tracks.length),
    [tracks.length],
  );

  // Reload + keep playing when the track changes (skips the initial mount).
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setProgress(0);
    audioRef.current?.load();
    if (playingRef.current) play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  /// Set initial volume on mount, but do not autoplay.
  useEffect(() => {
    const a = audioRef.current;
    if (a) {
      a.volume = 0.6;
    }
  }, []);

  const onTime = () => {
    const a = audioRef.current;
    if (a && a.duration) setProgress(a.currentTime / a.duration);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    if (a && a.duration) {
      a.currentTime = frac * a.duration;
      setProgress(frac);
    }
  };

  const ctrlBtn =
    "flex items-center justify-center rounded-lg text-ink/70 transition-colors hover:text-ink";

  return (
    <div className="shrink-0 rounded-2xl border border-line bg-card p-3 shadow-frame">
      <audio
        ref={audioRef}
        src={track.src}
        onTimeUpdate={onTime}
        onEnded={() => go(1)}
        preload="none"
      />

      <div className="flex items-baseline justify-between px-0.5">
        <span className="truncate font-medium tracking-tight text-ink">{track.title}</span>
        <span className="ml-2 shrink-0 font-mono text-[11px] tabular-nums text-muted">
          {index + 1} / {tracks.length}
        </span>
      </div>

      {/* Waveform = seek bar. Played bars are charcoal; the rest are hairline. */}
      <div
        onClick={seek}
        role="slider"
        aria-label="seek"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        className="mt-2 flex h-9 cursor-pointer items-center gap-[2px]"
      >
        {BARS.map((h, i) => (
          <span
            key={i}
            style={{ height: `${h}%` }}
            className={`flex-1 rounded-full transition-colors ${
              i / BARS.length <= progress ? "bg-ink" : "bg-line"
            }`}
          />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-center gap-4">
        <button type="button" onClick={() => go(-1)} aria-label="previous track" className={ctrlBtn}>
          <Icon path={PREV} />
        </button>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "pause" : "play"}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white transition-colors hover:opacity-90"
        >
          <Icon path={playing ? PAUSE : PLAY} />
        </button>
        <button type="button" onClick={() => go(1)} aria-label="next track" className={ctrlBtn}>
          <Icon path={NEXT} />
        </button>
      </div>
    </div>
  );
}
