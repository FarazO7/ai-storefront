import InterestButton from "@/components/InterestButton";
import { FORMATS, type Format } from "@/lib/pricing";

export type ViewProduct = { id?: string; format: Format; title: string; price: number; description: string; buttonLabel: string };
export type ViewStore = { name: string; handle: string | null; bio: string; products: ViewProduct[] };
export type Block = "bio" | number;
export type EditControls = { onEdit: (block: Block) => void; onRedo: (block: Block) => void; busy: Block | null; disabled: boolean };

const AVATAR_COLOURS = ["bg-rose-600", "bg-amber-600", "bg-emerald-600", "bg-sky-600", "bg-violet-600", "bg-teal-600"];

// Covers are drawn in code: one colour per format, with the title and format label. No images.
const COVERS: Record<Format, string> = {
  ebook: "from-amber-400 to-orange-600",
  template: "from-teal-400 to-cyan-700",
  course: "from-indigo-400 to-indigo-700",
  workshop: "from-rose-400 to-rose-700",
  community: "from-emerald-400 to-emerald-700",
  call: "from-sky-400 to-blue-700",
  package: "from-violet-400 to-purple-700",
};

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => Array.from(word)[0].toUpperCase()).join("") || "?";
}

const Skeleton = ({ className }: { className: string }) => <div aria-hidden className={`animate-pulse rounded-lg bg-zinc-200 ${className}`} />;

function BlockActions({ block, edit }: { block: Block; edit: EditControls }) {
  const button = "h-11 rounded-full border border-zinc-300 bg-white px-4 text-sm font-medium disabled:opacity-40";
  return (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={() => edit.onEdit(block)} disabled={edit.disabled} className={button}>
        Edit
      </button>
      <button type="button" onClick={() => edit.onRedo(block)} disabled={edit.disabled} className={button}>
        {edit.busy === block ? "Redoing…" : "Redo"}
      </button>
    </div>
  );
}

// One renderer for the editor and the public page, so creators see exactly what visitors see.
export default function StoreView({ store, edit, pending = false }: { store: ViewStore; edit?: EditControls; pending?: boolean }) {
  const name = store.name.trim();
  const colour = AVATAR_COLOURS[Array.from(name).reduce((sum, ch) => sum + ch.codePointAt(0)!, 0) % AVATAR_COLOURS.length];

  return (
    <article aria-busy={pending} className="flex flex-col gap-6 break-words">
      <header className={`flex flex-col gap-3 ${edit?.busy === "bio" ? "opacity-50" : ""}`}>
        {edit && <BlockActions block="bio" edit={edit} />}
        <div className="flex flex-col items-center gap-2 text-center">
          <div aria-hidden className={`flex size-20 items-center justify-center rounded-full text-2xl font-semibold text-white ${colour}`}>
            {initials(name)}
          </div>
          {name ? (
            <h1 className="text-2xl font-semibold">{name}</h1>
          ) : edit ? (
            <button type="button" onClick={() => edit.onEdit("bio")} className="min-h-11 text-2xl font-semibold text-zinc-400 underline decoration-dashed">
              Add your name
            </button>
          ) : (
            <h1 className="text-2xl font-semibold text-zinc-400">Add your name</h1>
          )}
          {store.handle && (
            <a href={`https://instagram.com/${store.handle}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center text-sky-700 underline">
              @{store.handle} on Instagram
            </a>
          )}
          {store.bio ? (
            <p className="text-zinc-700">{store.bio}</p>
          ) : (
            <div className="flex w-full flex-col items-center gap-2">
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-7/12" />
            </div>
          )}
        </div>
      </header>

      <ul className="flex flex-col gap-4">
        {store.products.map((product, index) => (
          <li
            key={product.id ?? index}
            className={`flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 shadow-sm ${edit?.busy === index ? "opacity-50" : ""}`}
          >
            {edit && <BlockActions block={index} edit={edit} />}
            <div aria-hidden className={`flex h-36 flex-col justify-end rounded-xl bg-linear-to-br p-4 text-white ${COVERS[product.format]}`}>
              <span className="text-xs font-semibold uppercase tracking-wide">{FORMATS[product.format].label}</span>
              <span className="mt-1 line-clamp-3 text-lg leading-snug font-semibold">{product.title}</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Coming soon</p>
            <h2 className="text-lg leading-snug font-semibold">{product.title}</h2>
            <p className="text-sm text-zinc-500">{FORMATS[product.format].label}</p>
            <p className="text-xl font-semibold">₹{product.price.toLocaleString("en-IN")}</p>
            <p className="text-zinc-700">{product.description}</p>
            <InterestButton label={product.buttonLabel} handle={store.handle} />
          </li>
        ))}
        {pending && (
          <li aria-hidden className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4">
            <Skeleton className="h-36" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-12" />
          </li>
        )}
      </ul>
    </article>
  );
}
