/** Colour-coded difficulty badge: [Easy] / [Medium] / [Hard] / [Insane]. */
export default function DifficultyPill({ value }: { value: string }) {
  const tone: Record<string, string> = {
    Easy: "text-[#1a7f37] bg-[#1a7f37]/10 border-[#1a7f37]/25",
    Medium: "text-[#9a6700] bg-[#9a6700]/10 border-[#9a6700]/25",
    Hard: "text-[#b91c1c] bg-[#b91c1c]/10 border-[#b91c1c]/25",
    Insane: "text-[#6d28d9] bg-[#6d28d9]/10 border-[#6d28d9]/25",
  };
  return (
    <span
      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium ${
        tone[value] ?? "text-muted bg-surface border-line"
      }`}
    >
      [{value}]
    </span>
  );
}
