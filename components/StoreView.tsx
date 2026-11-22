import { ChevronDown, MousePointerClick, Pencil, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import InterestButton from "@/components/InterestButton";
import ShareButton from "@/components/ShareButton";
import Button from "@/components/ui/Button";
import InfoTip from "@/components/ui/InfoTip";
import { Badge, MetricChip } from "@/components/ui/Status";
import { Skeleton } from "@/components/ui/Surfaces";
import { AVATAR_COLOURS, type ThemeId } from "@/lib/constants";
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

const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => Array.from(word)[0].toUpperCase()).join("") || "?";
}

function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  const index = Array.from(name).reduce((sum, ch) => sum + ch.codePointAt(0)!, 0) % AVATAR_COLOURS.length;
  return (
    <div
      aria-hidden
      style={{ backgroundColor: `var(--avatar-${index})` }}
      className={`flex shrink-0 items-center justify-center rounded-pill font-semibold text-text-inverted ${large ? "size-20 text-stat" : "size-8 text-micro"}`}
    >
      {initials(name)}
    </div>
  );
}

const SectionLabel = ({ id, children }: { id?: string; children: ReactNode }) => (
  <h2 id={id} className="text-ui font-medium tracking-label text-text-3 uppercase">
    {children}
  </h2>
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
        {/* Ink, not accent blue: blue text on the grey box is under 4.5:1. */}
        <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-1 rounded-card font-medium text-text-1 [&::-webkit-details-marker]:hidden">
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

function Price({ product }: { product: ViewProduct }) {
  const off = product.launchPrice !== undefined ? Math.round((1 - product.launchPrice / product.price) * 100) : null;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      {off !== null && <span className="sr-only">Launch price</span>}
      <span className="text-title font-semibold text-text-1">{rupees(product.launchPrice ?? product.price)}</span>
      {off !== null && (
        <>
          <span className="sr-only">, regular price</span>
          <s className="text-ui text-text-3">{rupees(product.price)}</s>
          <span className="text-ui font-medium text-discount">({off}% off)</span>
        </>
      )}
    </p>
  );
}

// One renderer for the public page and both editor previews, so creators see exactly what visitors see.
// `slug` is set on the public page only: it makes the interest buttons count taps and the "Built with" pill a link.
// The two-column layout follows the width the store is drawn at (a container query), not the screen, so the
// editor's phone frame shows the phone layout and its browser frame the desktop one.
export default function StoreView({ store, edit, pending = false, slug, shareUrl }: { store: ViewStore; edit?: EditControls; pending?: boolean; slug?: string; shareUrl?: string }) {
  const name = store.name.trim();
  const testimonials = store.testimonials ?? [];
  const pill = "tap-44 shrink-0 rounded-pill bg-surface-1 px-3 py-1.5 text-ui font-medium text-text-1";

  return (
    // The theme's colours reach every child through CSS variables.
    <article aria-busy={pending} data-store-theme={store.theme ?? "classic"} className="@container relative min-h-full bg-(--store-bg) break-words transition-colors duration-(--duration-base)">
      <div aria-hidden className="store-band absolute inset-x-0 top-0 h-40 @min-[992px]:h-[512px]" />

      <div className="relative mx-auto flex max-w-[1152px] items-center justify-between gap-3 px-4 py-3 @min-[992px]:px-6 @min-[992px]:py-5">
        <div className="flex min-w-0 items-center gap-2 text-text-inverted">
          <Avatar name={name} />
          <span className="truncate text-ui font-medium">{name || "Your store"}</span>
        </div>
        {slug ? (
          <Link href="/" className={pill}>
            Built with AI Storefront
          </Link>
        ) : (
          <span className={pill}>Built with AI Storefront</span>
        )}
      </div>

      <div className="relative mx-auto mt-2 max-w-[1152px] rounded-t-page bg-surface-1 px-4 pt-6 pb-10 @min-[992px]:mt-4 @min-[992px]:mb-12 @min-[992px]:rounded-page @min-[992px]:p-12 @min-[992px]:shadow-raised">
        <div className="mx-auto flex w-full max-w-[640px] flex-col gap-8 @min-[992px]:grid @min-[992px]:max-w-none @min-[992px]:grid-cols-[minmax(0,1fr)_378px] @min-[992px]:items-start @min-[992px]:gap-12">
          <section
            aria-label="About the creator"
            className={`flex flex-col items-center gap-3 text-center @min-[992px]:sticky @min-[992px]:top-6 @min-[992px]:col-start-2 @min-[992px]:row-start-1 @min-[992px]:items-start @min-[992px]:rounded-float @min-[992px]:border @min-[992px]:border-stroke-primary @min-[992px]:p-6 @min-[992px]:text-left @min-[992px]:shadow-checkout ${edit?.busy === "bio" ? "opacity-50" : ""}`}
          >
            {edit && (
              <div className="self-stretch">
                <BlockActions block="bio" edit={edit} />
              </div>
            )}
            <Avatar name={name} large />
            {name ? (
              <h1 className="text-display font-bold text-text-1">{name}</h1>
            ) : edit ? (
              <button type="button" onClick={() => edit.onEdit("bio")} className="min-h-11 rounded-card text-display font-bold text-text-4 underline decoration-dashed">
                Add your name
              </button>
            ) : (
              <h1 className="text-display font-bold text-text-4">Add your name</h1>
            )}
            {store.handle && (
              <a href={`https://instagram.com/${store.handle}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center rounded-card text-ui font-medium text-(--store-link) underline">
                @{store.handle} on Instagram
              </a>
            )}
            {store.bio ? (
              <p className="text-body text-text-2">{store.bio}</p>
            ) : (
              <div className="flex w-full flex-col items-center gap-2 @min-[992px]:items-start">
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-10/12" />
                <Skeleton className="h-4 w-7/12" />
              </div>
            )}
            {shareUrl && !pending && <ShareButton path={shareUrl} title={`${name}'s store`} />}
          </section>

          <div className="flex flex-col gap-8 @min-[992px]:col-start-1 @min-[992px]:row-start-1">
            <section aria-labelledby="products-heading" className="flex flex-col gap-4">
              <SectionLabel id="products-heading">Products</SectionLabel>
              <ul className="flex flex-col gap-4">
                {store.products.map((product, index) => {
                  return (
                    <li
                      key={product.id ?? index}
                      className={`flex flex-col gap-3 rounded-float border border-stroke-primary bg-surface-1 p-4 shadow-card ${edit?.busy === index ? "opacity-50" : ""}`}
                    >
                      {edit && <BlockActions block={index} edit={edit} />}
                      {/* Covers are drawn in code: one colour per format, with the title and format label. No images. */}
                      <div aria-hidden data-cover={product.format} className="store-cover flex h-40 flex-col justify-end rounded-card p-4 text-text-inverted">
                        <span className="text-micro font-semibold tracking-label uppercase">{FORMATS[product.format].label}</span>
                        <span className="mt-1 line-clamp-3 text-title font-semibold">{product.title}</span>
                      </div>
                      <p className="text-micro font-semibold tracking-label text-(--store-accent) uppercase">Coming soon</p>
                      <h3 className="text-title font-semibold text-text-1">{product.title}</h3>
                      <p className="-mt-2 text-ui text-text-2">{FORMATS[product.format].label}</p>
                      <Price product={product} />
                      {edit && FORMATS[product.format].lowConfidence && (
                        <span className="-mt-1">
                          <Badge tone="warning">Based on few examples</Badge>
                        </span>
                      )}
                      <p className="text-body text-text-1">{product.description}</p>
                      <InterestButton label={product.buttonLabel} handle={store.handle} tap={slug && product.id ? { slug, productId: product.id } : undefined} />
                      {product.faqs && product.faqs.length > 0 && (
                        // Collapsed: visitors open only the questions they care about.
                        <div className="flex flex-col">
                          <p className="text-micro font-semibold tracking-label text-text-3 uppercase">Questions</p>
                          {product.faqs.map((faq, j) => (
                            <details key={j} className="group/faq border-b border-stroke-primary last:border-b-0">
                              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-2 text-ui font-medium text-text-1 [&::-webkit-details-marker]:hidden">
                                <span>{faq.question}</span>
                                <ChevronDown aria-hidden className="size-4 shrink-0 text-text-3 transition-transform duration-(--duration-base) group-open/faq:rotate-180" />
                              </summary>
                              <p className="pb-3 text-ui text-text-2">{faq.answer}</p>
                            </details>
                          ))}
                        </div>
                      )}
                      {edit && <EditorNotes product={product} taps={edit.taps && product.id ? (edit.taps[product.id] ?? 0) : undefined} />}
                    </li>
                  );
                })}
                {pending && (
                  <li aria-hidden className="flex flex-col gap-3 rounded-float border border-stroke-primary bg-surface-1 p-4">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-12" />
                  </li>
                )}
              </ul>
            </section>

            {(testimonials.length > 0 || (edit && !pending)) && (
              <section aria-labelledby={testimonials.length > 0 ? "testimonials-heading" : undefined} aria-label={testimonials.length > 0 ? undefined : "Testimonials"} className="flex flex-col gap-4">
                {testimonials.length > 0 && <SectionLabel id="testimonials-heading">What people say</SectionLabel>}
                {testimonials.map((testimonial, index) => (
                  <figure key={index} className="flex flex-col gap-2 rounded-float border border-stroke-primary bg-surface-1 p-4">
                    <blockquote className="text-body text-text-1">&ldquo;{testimonial.text}&rdquo;</blockquote>
                    <figcaption className="text-ui font-medium text-text-2">{testimonial.name}</figcaption>
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
          </div>
        </div>
      </div>
    </article>
  );
}
