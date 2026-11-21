import type { ReactNode } from "react";

/** White card with a hairline border; raised adds a soft shadow. */
export function Card({ raised, className = "", children }: { raised?: boolean; className?: string; children: ReactNode }) {
  return <div className={`rounded-card border border-stroke-primary bg-surface-1 p-4 ${raised ? "shadow-raised" : "shadow-card"} ${className}`}>{children}</div>;
}

/** A placeholder block shaped like the content that's coming. */
export function Skeleton({ circle, className = "" }: { circle?: boolean; className?: string }) {
  return <div aria-hidden className={`skeleton animate-pulse ${circle ? "rounded-pill" : "rounded-card"} ${className}`} />;
}

/** Centred illustration, title, a line of help and one action. */
export function EmptyState({ title, children, action }: { title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[304px] flex-col items-center gap-4 text-center">
      <EmptyShop />
      <h2 className="text-ui font-semibold text-empty-title">{title}</h2>
      {children && <p className="text-ui text-text-2">{children}</p>}
      {action}
    </div>
  );
}

// An original illustration: an empty shopfront with a striped awning and a small sparkle.
function EmptyShop() {
  return (
    <svg viewBox="0 0 120 120" className="size-30" aria-hidden>
      <ellipse cx="60" cy="106" rx="42" ry="5" className="fill-surface-2" />
      <rect x="24" y="44" width="72" height="60" rx="6" className="fill-surface-1 stroke-stroke-secondary" strokeWidth="2" />
      <rect x="31" y="62" width="15" height="13" rx="2" className="fill-surface-2" />
      <rect x="74" y="62" width="15" height="13" rx="2" className="fill-surface-2" />
      <rect x="51" y="70" width="18" height="34" rx="3" className="fill-surface-2 stroke-stroke-secondary" strokeWidth="2" />
      <path
        d="M22 30h76l6 14a11 11 0 0 1-22 0a11 11 0 0 1-22 0a11 11 0 0 1-22 0a11 11 0 0 1-22 0z"
        className="fill-surface-accent stroke-accent"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M101 10l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" className="fill-ai-blue" />
    </svg>
  );
}
