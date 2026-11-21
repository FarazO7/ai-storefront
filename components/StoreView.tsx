import type { CSSProperties } from "react";
import InterestButton from "@/components/InterestButton";
import { themeVars, type ThemeId } from "@/lib/constants";
import { CALL_RUPEES_PER_MINUTE, CREATOR_PLAN_MONTHLY_RUPEES, EXAMPLES, FORMATS, SHARE_AFTER_FEE, type Format } from "@/lib/pricing";

export type ViewProduct = {
  id?: string;
  format: Format;
  title: string;
  price: number;
  launchPrice?: number;
  rationale?: string;
  description: string;
  buttonLabel: string;
};
export type ViewStore = {
  name: string;
  handle: string | null;
  bio: string;
  products: ViewProduct[];
  testimonials?: { name: string; text: string }[];
  theme?: ThemeId;
};
export type Block = "bio" | number;
export type EditControls = {
  onEdit: (block: Block) => void;
  onRedo: (block: Block) => void;
  onTestimonial: (index: number | null) => void; // null adds a new one
  busy: Block | null;
  disabled: boolean;
  taps?: Record<string, number>; // only on the edit link
};

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

const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
const secondary = "h-11 rounded-full border border-zinc-300 bg-white px-4 text-sm font-medium disabled:opacity-40";

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => Array.from(word)[0].toUpperCase()).join("") || "?";
}

const Skeleton = ({ className }: { className: string }) => <div aria-hidden className={`animate-pulse rounded-lg bg-zinc-200 ${className}`} />;

function BlockActions({ block, edit }: { block: Block; edit: EditControls }) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={() => edit.onEdit(block)} disabled={edit.disabled} className={secondary}>
        Edit
      </button>
      <button type="button" onClick={() => edit.onRedo(block)} disabled={edit.disabled} className={secondary}>
        {edit.busy === block ? "Redoing…" : "Redo"}
      </button>
    </div>
  );
}

// Editor only, never on the public page: why this price, the break-even line and interest taps.
function EditorNotes({ product, taps }: { product: ViewProduct; taps?: number }) {
  const band = FORMATS[product.format];
  const price = product.launchPrice ?? product.price;
  const sales = Math.ceil(CREATOR_PLAN_MONTHLY_RUPEES / (price * SHARE_AFTER_FEE));
  const examples = Object.entries(EXAMPLES).flatMap(([niche, list]) =>
    list.filter(([format]) => format === product.format).map(([, amount, detail]) => `${niche}: ${rupees(amount)}${detail ? ` (${detail})` : ""}`),
  );

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
      <p>
        About {sales} {sales === 1 ? "sale" : "sales"} a month at this price would cover SuperProfile&apos;s {rupees(CREATOR_PLAN_MONTHLY_RUPEES)} Creator plan, after its 5% fee.
      </p>
      <details>
        <summary className="flex min-h-11 cursor-pointer items-center font-medium">Why this price</summary>
        <div className="flex flex-col gap-2 pb-1">
          {product.rationale && <p>{product.rationale}</p>}
          <p>
            {band.plural} in my research: {rupees(band.lowest)} to {rupees(band.highest)}, middle {rupees(band.median)} ({band.n} price{" "}
            {band.n === 1 ? "point" : "points"}).
          </p>
          {product.format === "call" && (
            <p>
              Across calls, the middle is {rupees(CALL_RUPEES_PER_MINUTE.median)} a minute ({rupees(CALL_RUPEES_PER_MINUTE.lowest)} to{" "}
              {rupees(CALL_RUPEES_PER_MINUTE.highest)}).
            </p>
          )}
          {examples.length > 0 && (
            <ul className="list-disc pl-5">
              {examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
          )}
        </div>
      </details>
      {taps !== undefined && (
        <p className="font-medium text-zinc-900">
          {taps} {taps === 1 ? "person" : "people"} tapped &ldquo;{product.buttonLabel}&rdquo;
        </p>
      )}
    </div>
  );
}

// One renderer for the editor and the public page, so creators see exactly what visitors see.
// `slug` is set on the public page only: it makes the interest buttons count taps.
export default function StoreView({ store, edit, pending = false, slug }: { store: ViewStore; edit?: EditControls; pending?: boolean; slug?: string }) {
  const name = store.name.trim();
  const colour = AVATAR_COLOURS[Array.from(name).reduce((sum, ch) => sum + ch.codePointAt(0)!, 0) % AVATAR_COLOURS.length];
  const testimonials = store.testimonials ?? [];

  return (
    // The theme's colours reach every child through CSS variables; the page around it paints the background.
    <article aria-busy={pending} style={themeVars(store.theme) as CSSProperties} className="flex flex-col gap-6 break-words">
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
            <a href={`https://instagram.com/${store.handle}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center text-(--store-link) underline">
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
            className={`flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm ${edit?.busy === index ? "opacity-50" : ""}`}
          >
            {edit && <BlockActions block={index} edit={edit} />}
            <div aria-hidden className={`flex h-36 flex-col justify-end rounded-xl bg-linear-to-br p-4 text-white ${COVERS[product.format]}`}>
              <span className="text-xs font-semibold uppercase tracking-wide">{FORMATS[product.format].label}</span>
              <span className="mt-1 line-clamp-3 text-lg leading-snug font-semibold">{product.title}</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-(--store-accent)">Coming soon</p>
            <h2 className="text-lg leading-snug font-semibold">{product.title}</h2>
            <p className="text-sm text-zinc-500">{FORMATS[product.format].label}</p>
            <p className="flex items-baseline gap-2">
              {product.launchPrice !== undefined && <span className="sr-only">Launch price</span>}
              <span className="text-xl font-semibold">{rupees(product.launchPrice ?? product.price)}</span>
              {product.launchPrice !== undefined && (
                <>
                  <span className="sr-only">, regular price</span>
                  <s className="text-zinc-500">{rupees(product.price)}</s>
                </>
              )}
            </p>
            {edit && FORMATS[product.format].lowConfidence && <p className="-mt-2 text-xs font-medium text-amber-700">Based on few examples</p>}
            <p className="text-zinc-700">{product.description}</p>
            <InterestButton label={product.buttonLabel} handle={store.handle} tap={slug && product.id ? { slug, productId: product.id } : undefined} />
            {edit && <EditorNotes product={product} taps={edit.taps && product.id ? (edit.taps[product.id] ?? 0) : undefined} />}
          </li>
        ))}
        {pending && (
          <li aria-hidden className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
            <Skeleton className="h-36" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-12" />
          </li>
        )}
      </ul>

      {(testimonials.length > 0 || (edit && !pending)) && (
        <section className="flex flex-col gap-3">
          {testimonials.length > 0 && <h2 className="text-lg font-semibold">What people say</h2>}
          {testimonials.map((testimonial, index) => (
            <figure key={index} className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4">
              <blockquote className="text-zinc-700">&ldquo;{testimonial.text}&rdquo;</blockquote>
              <figcaption className="text-sm font-medium">{testimonial.name}</figcaption>
              {edit && (
                <button type="button" onClick={() => edit.onTestimonial(index)} disabled={edit.disabled} className={`self-end ${secondary}`}>
                  Edit
                </button>
              )}
            </figure>
          ))}
          {edit && testimonials.length < 3 && (
            <button
              type="button"
              onClick={() => edit.onTestimonial(null)}
              disabled={edit.disabled}
              className="h-12 rounded-xl border border-dashed border-zinc-400 font-medium text-zinc-700 disabled:opacity-40"
            >
              + Add a testimonial
            </button>
          )}
        </section>
      )}
    </article>
  );
}
