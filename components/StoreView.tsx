import { ChevronDown, MousePointerClick, Pencil, Plus, RefreshCw } from "lucide-react";
import type { CSSProperties } from "react";
import Button from "@/components/ui/Button";
import InfoTip from "@/components/ui/InfoTip";
import { Badge, MetricChip } from "@/components/ui/Status";
import { Skeleton } from "@/components/ui/Surfaces";
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
  faqs?: { question: string; answer: string }[];
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

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => Array.from(word)[0].toUpperCase()).join("") || "?";
}


// Collapsible rows: a "+" that turns into "×" when open, so they look tappable (Safari's own marker is hidden).
const summaryClass = "flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden";
const OpenMark = () => (
  <span aria-hidden className="text-lg leading-none text-zinc-400 transition-transform group-open:rotate-45">
    +
  </span>
);

/** Edit and Redo for one block. The block being redone shows a spinner; everything else waits. */
export function BlockActions({ block, edit, align = "end" }: { block: Block; edit: EditControls; align?: "start" | "end" }) {
  return (
    <div className={`flex gap-2 ${align === "end" ? "justify-end" : ""}`}>
      <Button variant="tertiary" size="sm" icon={<Pencil aria-hidden />} onClick={() => edit.onEdit(block)} disabled={edit.disabled}>
        Edit
      </Button>
      <Button variant="tertiary" size="sm" icon={<RefreshCw aria-hidden />} onClick={() => edit.onRedo(block)} disabled={edit.disabled && edit.busy !== block} loading={edit.busy === block}>
        Redo
      </Button>
    </div>
  );
}

// Editor only, never on the public page: interest taps, the break-even line and why this price.
export function EditorNotes({ product, taps }: { product: ViewProduct; taps?: number }) {
  const band = FORMATS[product.format];
  const price = product.launchPrice ?? product.price;
  const sales = Math.ceil(CREATOR_PLAN_MONTHLY_RUPEES / (price * SHARE_AFTER_FEE));
  const examples = Object.entries(EXAMPLES).flatMap(([niche, list]) =>
    list.filter(([format]) => format === product.format).map(([, amount, detail]) => `${niche}: ${rupees(amount)}${detail ? ` (${detail})` : ""}`),
  );

  return (
    <div className="flex flex-col gap-2 rounded-card bg-surface-2 p-3 text-ui text-text-2">
      {taps !== undefined && (
        <p className="flex items-center gap-1">
          <MetricChip icon={<MousePointerClick aria-hidden />}>
            {taps} {taps === 1 ? "tap" : "taps"}
          </MetricChip>
          <InfoTip label="About interest taps">People who tapped &ldquo;{product.buttonLabel}&rdquo; on your public page.</InfoTip>
        </p>
      )}
      <p>
        About {sales} {sales === 1 ? "sale" : "sales"} a month at this price would cover SuperProfile&apos;s {rupees(CREATOR_PLAN_MONTHLY_RUPEES)} Creator plan, after its 5% fee.
      </p>
      <details className="group/why">
        <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-1 rounded-card font-medium text-text-accent [&::-webkit-details-marker]:hidden">
          Why this price
          <ChevronDown aria-hidden className="size-4 transition-transform duration-(--duration-base) group-open/why:rotate-180" />
        </summary>
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
              {/* The research has repeat price points (two fitness courses at ₹599), so key by position. */}
              {examples.map((example, i) => (
                <li key={i}>{example}</li>
              ))}
            </ul>
          )}
        </div>
      </details>
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
            <button type="button" onClick={() => edit.onEdit("bio")} className="min-h-11 rounded-card text-2xl font-semibold text-text-4 underline decoration-dashed">
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
            {edit && FORMATS[product.format].lowConfidence && (
              <span className="-mt-1">
                <Badge tone="warning">Based on few examples</Badge>
              </span>
            )}
            <p className="text-zinc-700">{product.description}</p>
            <InterestButton label={product.buttonLabel} handle={store.handle} tap={slug && product.id ? { slug, productId: product.id } : undefined} />
            {product.faqs && product.faqs.length > 0 && (
              // Collapsed: visitors open only the questions they care about.
              <div className="flex flex-col">
                <p className="text-sm font-semibold">Questions</p>
                {product.faqs.map((faq, j) => (
                  <details key={j} className="group border-b border-zinc-200 last:border-b-0">
                    <summary className={summaryClass}>
                      <span>{faq.question}</span>
                      <OpenMark />
                    </summary>
                    <p className="pb-3 text-sm text-zinc-700">{faq.answer}</p>
                  </details>
                ))}
              </div>
            )}
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
                <Button variant="tertiary" size="sm" icon={<Pencil aria-hidden />} onClick={() => edit.onTestimonial(index)} disabled={edit.disabled} className="self-end">
                  Edit
                </Button>
              )}
            </figure>
          ))}
          {edit && testimonials.length < 3 && (
            <Button variant="tertiary" size="lg" icon={<Plus aria-hidden />} onClick={() => edit.onTestimonial(null)} disabled={edit.disabled} className="w-full border-dashed">
              Add a testimonial
            </Button>
          )}
        </section>
      )}
    </article>
  );
}
