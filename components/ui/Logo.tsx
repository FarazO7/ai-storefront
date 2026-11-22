/** The AI Storefront mark (an original shopfront with a scalloped awning) and wordmark. `inverted` is for dark or gradient backgrounds. */
export default function Logo({ wordmark = true, inverted = false }: { wordmark?: boolean; inverted?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${inverted ? "text-text-inverted" : "text-text-1"}`}>
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" role="img" aria-label={wordmark ? undefined : "AI Storefront"} aria-hidden={wordmark || undefined}>
        <rect width="32" height="32" rx="8" className={inverted ? "fill-surface-1" : "fill-ink"} />
        <path d="M9 8h14l2 5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" className={inverted ? "fill-ink" : "fill-text-inverted"} />
        <path d="M9 18v6h14v-6" fill="none" className={inverted ? "stroke-ink" : "stroke-text-inverted"} strokeWidth="2" strokeLinejoin="round" />
        <path d="M14.25 24v-3.5h3.5V24" fill="none" className={inverted ? "stroke-ink" : "stroke-text-inverted"} strokeWidth="1.75" strokeLinejoin="round" />
      </svg>
      {wordmark && <span className="text-body font-semibold">AI Storefront</span>}
    </span>
  );
}
