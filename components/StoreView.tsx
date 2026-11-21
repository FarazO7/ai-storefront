import InterestButton from "@/components/InterestButton";
import { FORMATS } from "@/lib/pricing";
import type { Store } from "@/lib/schema";

const AVATAR_COLOURS = ["bg-rose-600", "bg-amber-600", "bg-emerald-600", "bg-sky-600", "bg-violet-600", "bg-teal-600"];

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => Array.from(word)[0].toUpperCase()).join("") || "?";
}

// One renderer for the editor preview and the public page, so creators see exactly what visitors see.
export default function StoreView({ store }: { store: Store }) {
  const name = store.name.trim();
  const colour = AVATAR_COLOURS[Array.from(name).reduce((sum, ch) => sum + ch.codePointAt(0)!, 0) % AVATAR_COLOURS.length];

  return (
    <article className="flex flex-col gap-6 break-words">
      <header className="flex flex-col items-center gap-2 text-center">
        <div aria-hidden className={`flex size-20 items-center justify-center rounded-full text-2xl font-semibold text-white ${colour}`}>
          {initials(name)}
        </div>
        <h1 className={`text-2xl font-semibold ${name ? "" : "text-zinc-400"}`}>{name || "Add your name"}</h1>
        {store.handle && (
          <a
            href={`https://instagram.com/${store.handle}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center text-sky-700 underline"
          >
            @{store.handle} on Instagram
          </a>
        )}
        <p className="text-zinc-700">{store.bio}</p>
      </header>

      <ul className="flex flex-col gap-4">
        {store.products.map((product) => (
          <li key={product.id} className="rounded-2xl border border-zinc-200 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Coming soon</p>
            <h2 className="mt-1 text-lg font-semibold leading-snug">{product.title}</h2>
            <p className="text-sm text-zinc-500">{FORMATS[product.format].label}</p>
            <p className="mt-2 text-xl font-semibold">₹{product.price.toLocaleString("en-IN")}</p>
            <p className="mt-2 text-zinc-700">{product.description}</p>
            <InterestButton label={product.buttonLabel} handle={store.handle} />
          </li>
        ))}
      </ul>
    </article>
  );
}
