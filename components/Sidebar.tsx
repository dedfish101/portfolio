import MediaBox from "./MediaBox";
import MusicPlayer from "./MusicPlayer";
import BlockGame from "./BlockGame";
import ActionFooter from "./ActionFooter";

/**
 * Right column (35%): media → lofi player → mini-game → resume/socials,
 * stacked vertically. The game flexes to absorb remaining height.
 */
export default function Sidebar() {
  return (
    <aside className="flex min-h-0 flex-col gap-3">
      <MediaBox />
      <MusicPlayer />
      <BlockGame />
      <ActionFooter />
    </aside>
  );
}
