"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Minimal monochrome Tetris — low-resource <canvas> block-stacker.    */
/*  Focus the widget (click / Tab) then use arrow keys. Keeps to the    */
/*  #111 terminal aesthetic with grayscale blocks.                      */
/* ------------------------------------------------------------------ */

const COLS = 10;
const ROWS = 16;
// Fixed hi-res drawing buffer; CSS scales it to fill the panel (crisp on
// downscale, preserves the 10:16 board ratio).
const CELL = 20;

// Grayscale palette (index 1..7), drawn on a #111 board.
const SHADES = ["", "#ededed", "#d2d2d2", "#b6b6b6", "#9a9a9a", "#7e7e7e", "#c4c4c4", "#a8a8a8"];

// Tetromino shapes as square matrices (1 = filled). Rotated by transposing.
const PIECES: number[][][] = [
  [[1, 1, 1, 1]], // I
  [
    [1, 1],
    [1, 1],
  ], // O
  [
    [0, 1, 0],
    [1, 1, 1],
  ], // T
  [
    [0, 1, 1],
    [1, 1, 0],
  ], // S
  [
    [1, 1, 0],
    [0, 1, 1],
  ], // Z
  [
    [1, 0, 0],
    [1, 1, 1],
  ], // J
  [
    [0, 0, 1],
    [1, 1, 1],
  ], // L
];

type Cell = number;
type Piece = { shape: number[][]; color: number; x: number; y: number };

const emptyBoard = (): Cell[][] =>
  Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0));

function rotate(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const out: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) out[c][rows - 1 - r] = shape[r][c];
  return out;
}

function spawn(): Piece {
  const i = Math.floor(Math.random() * PIECES.length);
  const shape = PIECES[i];
  return { shape, color: i + 1, x: Math.floor((COLS - shape[0].length) / 2), y: 0 };
}

export default function BlockGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable game state kept in refs so the loop never triggers re-renders.
  const board = useRef<Cell[][]>(emptyBoard());
  const piece = useRef<Piece>(spawn());
  const dropTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [status, setStatus] = useState<"ready" | "playing" | "paused" | "over">("ready");
  const statusRef = useRef(status);
  statusRef.current = status;

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

    const drawCell = (x: number, y: number, color: number) => {
      ctx.fillStyle = SHADES[color];
      ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
    };

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) if (board.current[r][c]) drawCell(c, r, board.current[r][c]);

    const p = piece.current;
    for (let r = 0; r < p.shape.length; r++)
      for (let c = 0; c < p.shape[0].length; c++)
        if (p.shape[r][c]) drawCell(p.x + c, p.y + r, p.color);
  }, []);

  const collides = useCallback((shape: number[][], x: number, y: number) => {
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[0].length; c++) {
        if (!shape[r][c]) continue;
        const nx = x + c;
        const ny = y + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board.current[ny][nx]) return true;
      }
    return false;
  }, []);

  const lockAndNext = useCallback(() => {
    const p = piece.current;
    for (let r = 0; r < p.shape.length; r++)
      for (let c = 0; c < p.shape[0].length; c++)
        if (p.shape[r][c] && p.y + r >= 0) board.current[p.y + r][p.x + c] = p.color;

    // Clear full rows.
    let cleared = 0;
    board.current = board.current.filter((row) => {
      if (row.every((v) => v)) {
        cleared++;
        return false;
      }
      return true;
    });
    while (board.current.length < ROWS) board.current.unshift(Array<Cell>(COLS).fill(0));

    if (cleared) {
      setLines((l) => l + cleared);
      setScore((s) => s + [0, 40, 100, 300, 1200][cleared]);
    }

    const next = spawn();
    if (collides(next.shape, next.x, next.y)) {
      setStatus("over");
      if (dropTimer.current) clearInterval(dropTimer.current);
      return;
    }
    piece.current = next;
  }, [collides]);

  const step = useCallback(() => {
    if (statusRef.current !== "playing") return;
    const p = piece.current;
    if (!collides(p.shape, p.x, p.y + 1)) {
      p.y += 1;
    } else {
      lockAndNext();
    }
    draw();
  }, [collides, draw, lockAndNext]);

  const startLoop = useCallback(() => {
    if (dropTimer.current) clearInterval(dropTimer.current);
    dropTimer.current = setInterval(step, 550);
  }, [step]);

  const reset = useCallback(() => {
    board.current = emptyBoard();
    piece.current = spawn();
    setScore(0);
    setLines(0);
    setStatus("playing");
    startLoop();
    draw();
  }, [draw, startLoop]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const keys = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " ", "p", "P"];
      if (!keys.includes(e.key)) return;
      e.preventDefault();

      if (e.key === "p" || e.key === "P") {
        setStatus((s) => (s === "playing" ? "paused" : s === "paused" ? "playing" : s));
        return;
      }
      if (statusRef.current === "ready" || statusRef.current === "over") {
        if (e.key === " ") reset();
        return;
      }
      if (statusRef.current !== "playing") return;

      const p = piece.current;
      if (e.key === "ArrowLeft" && !collides(p.shape, p.x - 1, p.y)) p.x -= 1;
      else if (e.key === "ArrowRight" && !collides(p.shape, p.x + 1, p.y)) p.x += 1;
      else if (e.key === "ArrowDown" && !collides(p.shape, p.x, p.y + 1)) p.y += 1;
      else if (e.key === "ArrowUp") {
        const r = rotate(p.shape);
        if (!collides(r, p.x, p.y)) p.shape = r;
      } else if (e.key === " ") {
        while (!collides(p.shape, p.x, p.y + 1)) p.y += 1;
        lockAndNext();
      }
      draw();
    },
    [collides, draw, lockAndNext, reset],
  );

  // Keep the drop cadence in sync with play/pause; pause when tab hidden.
  useEffect(() => {
    if (status === "playing") startLoop();
    else if (dropTimer.current) clearInterval(dropTimer.current);
    return () => {
      if (dropTimer.current) clearInterval(dropTimer.current);
    };
  }, [status, startLoop]);

  useEffect(() => {
    draw();
    const onVis = () => document.hidden && setStatus((s) => (s === "playing" ? "paused" : s));
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [draw]);

  return (
    <aside className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-terminal text-white shadow-frame ring-1 ring-black/20">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">
          block.exe
        </span>
        <span className="flex gap-3 font-mono text-[11px] text-white/60">
          <span>
            score <span className="tabular-nums text-white">{score}</span>
          </span>
          <span>
            lines <span className="tabular-nums text-white">{lines}</span>
          </span>
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={COLS * CELL}
          height={ROWS * CELL}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onClick={() => (status === "ready" || status === "over") && reset()}
          aria-label="Tetris mini-game — focus and use arrow keys"
          className="h-full max-h-full w-auto max-w-full rounded-md outline-none ring-1 ring-white/10 focus:ring-neon/50"
        />

        {(status === "ready" || status === "over" || status === "paused") && (
          <button
            type="button"
            onClick={reset}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#111] font-mono text-white"
          >
            <span className="text-sm">
              {status === "over" ? "game over" : status === "paused" ? "paused" : "block stacker"}
            </span>
            <span className="text-[11px] text-white/55">
              {status === "paused" ? "press P to resume" : "click / space to play"}
            </span>
            <span className="mt-1 text-[10px] text-white/35">← → move · ↑ rotate · ↓ drop</span>
          </button>
        )}
      </div>
    </aside>
  );
}
