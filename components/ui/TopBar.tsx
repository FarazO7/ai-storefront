import Link from "next/link";
import Logo from "./Logo";

/** The slim bar with the logo. On the gradient header it's transparent with a white logo. */
export default function TopBar({ onHero = false }: { onHero?: boolean }) {
  return (
    <header className={`flex h-14 items-center px-4 md:px-12 ${onHero ? "" : "border-b border-stroke-primary bg-surface-1"}`}>
      <Link href="/" className="tap-44 rounded-card">
        <Logo inverted={onHero} />
      </Link>
    </header>
  );
}
