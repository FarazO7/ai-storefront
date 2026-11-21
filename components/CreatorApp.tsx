"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { HeaderSheet, ProductSheet, PublishedSheet, TestimonialSheet, type Field } from "@/components/EditSheets";
import InputScreen, { type Answer, type Input, type Notice } from "@/components/InputScreen";
import StoreView, { type Block } from "@/components/StoreView";
import type { GenerateEvent } from "@/lib/ai";
import { AI_ERROR, THEME_IDS, THEMES, themeVars, type ThemeId } from "@/lib/constants";
import type { GenerateResponse, Product, Store, StoredInput } from "@/lib/schema";
import type { ProductDraft } from "@/lib/validate";

type Published = { slug: string; token: string };
type Generating = { bio: string | null; products: ProductDraft[]; retrying: boolean; slow: boolean };
type Sheet = { kind: "header" } | { kind: "product"; index: number } | { kind: "testimonial"; index: number | null } | { kind: "published" } | null;
type Draft = { input: Input; answers: Answer[] | null; store: Store | null; edited: boolean; published: Published | null };

const DRAFT_KEY = "ai-storefront:draft:v1";
const EMPTY_INPUT: Input = { description: "", followers: null, handle: "", productInMind: "" };
const REDO_ERROR = "The AI is taking a break. Your version is unchanged; please try again.";
const PUBLISH_ERROR = "We couldn't publish just now. Your store is still here; please try again.";

// Any failure, including a dropped connection or a non-JSON reply, becomes a friendly message.
async function post<T>(url: string, body: unknown, fallback: string): Promise<T | { error: string }> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return await res.json();
  } catch {
    return { error: fallback };
  }
}

async function* readEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<GenerateEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = done ? "" : (lines.pop() ?? "");
    for (const line of lines) if (line.trim()) yield JSON.parse(line) as GenerateEvent;
    if (done) return;
  }
}

// Demo-only failure switch: /?ff=<secret>&mode=timeout|invalid&scope=main|all. The server ignores it without the right secret.
function forceFailHeaders(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const secret = params.get("ff");
  return secret
    ? { "x-force-fail": secret, "x-force-fail-mode": params.get("mode") ?? "timeout", "x-force-fail-scope": params.get("scope") ?? "main" }
    : {};
}

type Initial = { store: Store; input: StoredInput; slug: string; token: string; taps: Record<string, number> };

function readDraft(): Draft | null {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as Draft | null;
  } catch {
    return null; // private mode or blocked storage: start empty
  }
}

const noop = () => {};
const subscribeNoop = () => noop;

// The server (and the first paint) shows the empty form. On the phone, the app then mounts with the saved
// draft already in its state, so a refresh loses nothing. Edit links render straight away with the saved store.
export default function CreatorApp({ initial }: { initial?: Initial }) {
  const onPhone = useSyncExternalStore(subscribeNoop, () => true, () => false);
  if (!initial && !onPhone) {
    return (
      <InputScreen input={EMPTY_INPUT} onChange={noop} notice={null} busy={false} hasStore={false} onGenerate={noop} onRetry={noop} onAnswers={noop} onBackToStore={noop} />
    );
  }
  return <Creator initial={initial} />;
}

function Creator({ initial }: { initial?: Initial }) {
  const editLink = initial !== undefined;
  const [draft] = useState(() => (editLink ? null : readDraft()));
  const [input, setInput] = useState<Input>(
    initial
      ? { description: initial.input.description, followers: initial.input.followers, handle: initial.store.handle ?? "", productInMind: initial.input.productInMind ?? "" }
      : (draft?.input ?? EMPTY_INPUT),
  );
  const [answers, setAnswers] = useState<Answer[] | null>(initial ? (initial.input.answers ?? null) : (draft?.answers ?? null));
  const [store, setStore] = useState<Store | null>(initial ? initial.store : (draft?.store ?? null));
  const [edited, setEdited] = useState(draft?.edited ?? false);
  const [published, setPublished] = useState<Published | null>(initial ? { slug: initial.slug, token: initial.token } : (draft?.published ?? null));
  const [generating, setGenerating] = useState<Generating | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyBlock, setBusyBlock] = useState<Block | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [view, setView] = useState<"input" | "store">(() => (editLink || (draft?.store && location.hash === "#store") ? "store" : "input"));
  const running = useRef(false);
  const pushedStoreView = useRef(false);
  const lastAnswers = useRef<Answer[] | null>(null);

  useEffect(() => {
    // A "#store" left over from a refresh mid-generation, with nothing saved to show.
    if (!editLink && !draft?.store && location.hash === "#store") history.replaceState(null, "", location.pathname + location.search);
  }, [editLink, draft]);

  useEffect(() => {
    if (editLink) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ input, answers, store, edited, published } satisfies Draft));
    } catch {
      // Storage full or blocked: the page still works, it just won't survive a refresh.
    }
  }, [editLink, input, answers, store, edited, published]);

  // The phone's back button goes from the store back to the form.
  useEffect(() => {
    if (editLink) return;
    const onPop = () => setView(location.hash === "#store" ? "store" : "input");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [editLink]);

  function showStore() {
    if (!editLink && location.hash !== "#store") {
      history.pushState(null, "", "#store");
      pushedStoreView.current = true;
    }
    setView("store");
  }

  function showInput() {
    if (editLink) return;
    if (pushedStoreView.current && location.hash === "#store") {
      pushedStoreView.current = false;
      history.back(); // popstate switches the view
    } else {
      history.replaceState(null, "", location.pathname + location.search);
      setView("input");
    }
  }

  const handle = input.handle.trim().replace(/^@/, "");
  const storedInput = (withAnswers: Answer[] | null): StoredInput => ({
    description: input.description.trim(),
    followers: input.followers ?? "none",
    productInMind: input.productInMind.trim() || undefined,
    answers: withAnswers ?? undefined,
  });

  // fromEditor: "Redo all" keeps the current store on screen if anything goes wrong. From the form,
  // problems (questions, rejection, failure) show on the form, next to what the creator typed.
  async function generate(withAnswers: Answer[] | null, fromEditor = false) {
    if (running.current) return; // no double submits
    if (!fromEditor && edited && !window.confirm("This makes a new store and replaces your edits. Continue?")) return;
    running.current = true;
    lastAnswers.current = withAnswers;
    setNotice(null);
    setMessage(null);
    setSheet(null);
    setGenerating({ bio: null, products: [], retrying: false, slow: false });
    showStore();
    const slowTimer = setTimeout(() => setGenerating((g) => g && { ...g, slow: true }), 10_000);

    const fail = (text: string) => {
      if (fromEditor) {
        setMessage(text === AI_ERROR ? "The AI is taking a break. Your store is unchanged; please try again." : text);
      } else {
        setNotice({ kind: "failed", message: text });
        showInput();
      }
    };
    const finish = (result: GenerateResponse) => {
      if (result.status === "ok") {
        // The name, testimonials and theme are the creator's own, so a new store keeps them.
        setStore((s) => ({
          name: s?.name ?? "",
          handle: handle || null,
          bio: result.store.bio,
          products: result.store.products,
          testimonials: s?.testimonials,
          theme: s?.theme,
        }));
        setAnswers(withAnswers);
        setEdited(false);
      } else if (fromEditor) {
        setMessage(`${result.status === "rejected" ? result.reason : "The AI needs a little more detail."} Your store is unchanged.`);
      } else {
        setNotice(result.status === "rejected" ? { kind: "rejected", reason: result.reason } : { kind: "questions", questions: result.questions });
        showInput();
      }
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...forceFailHeaders() },
        body: JSON.stringify({ ...storedInput(withAnswers), handle: handle || undefined }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        fail(data?.error ?? AI_ERROR);
        return;
      }
      let ended = false;
      for await (const event of readEvents(res.body)) {
        if (event.type === "bio") setGenerating((g) => g && { ...g, bio: event.bio });
        else if (event.type === "product") setGenerating((g) => g && { ...g, products: [...g.products, event.product] });
        else if (event.type === "retry") setGenerating((g) => g && { bio: null, products: [], retrying: true, slow: g.slow });
        else if (event.type === "error") {
          ended = true;
          fail(event.message);
        } else if (event.type === "done") {
          ended = true;
          finish(event.result);
        }
      }
      if (!ended) fail(AI_ERROR);
    } catch {
      fail(AI_ERROR);
    } finally {
      clearTimeout(slowTimer);
      setGenerating(null);
      running.current = false;
    }
  }

  async function redo(block: Block) {
    if (!store) return;
    setBusyBlock(block);
    setMessage(null);
    const data = await post<{ bio: string } | { product: Product }>("/api/regenerate", { input: storedInput(answers), store, block }, REDO_ERROR);
    setBusyBlock(null);
    if ("error" in data) return setMessage(data.error);
    // Only this block changes, so manual edits elsewhere survive.
    setStore((s) => s && ("bio" in data ? { ...s, bio: data.bio } : { ...s, products: s.products.map((p, i) => (i === block ? data.product : p)) }));
  }

  async function rewrite(block: Block, field: Field, draft: Store): Promise<string | { error: string }> {
    const data = await post<{ value: string }>("/api/regenerate", { input: storedInput(answers), store: draft, block, field }, REDO_ERROR);
    return "error" in data ? data : data.value;
  }

  async function publish() {
    if (!store) return;
    if (!store.name.trim()) {
      setMessage("Add your name to publish.");
      setSheet({ kind: "header" });
      return;
    }
    setPublishing(true);
    setMessage(null);
    const data = await post<{ slug: string; token?: string }>("/api/publish", { store, input: storedInput(answers), ...published }, PUBLISH_ERROR);
    setPublishing(false);
    if ("error" in data) return setMessage(data.error);
    setPublished({ slug: data.slug, token: data.token ?? published?.token ?? "" });
    setSheet({ kind: "published" });
  }

  function redoAll() {
    if (edited && !window.confirm("Redo all replaces your edits with a new store. Continue?")) return;
    generate(answers, true);
  }

  if (view === "input" || (!store && !generating)) {
    return (
      <InputScreen
        input={input}
        onChange={setInput}
        notice={notice}
        busy={generating !== null}
        hasStore={store !== null}
        onGenerate={() => generate(null)}
        onRetry={() => generate(lastAnswers.current)}
        onAnswers={(next) => generate(next)}
        onBackToStore={showStore}
      />
    );
  }

  const shown = generating
    ? { name: store?.name ?? "", handle: handle || null, bio: generating.bio ?? "", products: generating.products, theme: store?.theme }
    : store!;
  const blocked = generating !== null || busyBlock !== null || publishing;

  return (
    <section className="flex flex-col gap-4">
      {!editLink && (
        <button type="button" onClick={showInput} disabled={generating !== null} className="min-h-11 self-start font-medium text-sky-700 underline disabled:opacity-40">
          ← Change my details
        </button>
      )}
      {generating && (
        <p role="status" className="rounded-xl bg-zinc-100 p-3 text-center text-zinc-700">
          {generating.retrying ? "Taking longer than usual. Trying again…" : generating.slow ? "Still working…" : "Writing your store…"}
        </p>
      )}
      {message && (
        <p role="alert" className="rounded-xl bg-amber-50 p-3 text-amber-900">
          {message}
        </p>
      )}

      {!generating && store && (
        <ThemePicker value={store.theme ?? "classic"} disabled={blocked} onChange={(theme) => setStore({ ...store, theme })} />
      )}

      {/* The preview gets the same background the public page will have. */}
      <div style={themeVars(shown.theme) as CSSProperties} className="-mx-4 bg-(--store-bg) px-4 py-6 transition-colors">
        <StoreView
          store={shown}
          pending={generating !== null}
          edit={
            generating
              ? undefined
              : {
                  onEdit: (block) => setSheet(block === "bio" ? { kind: "header" } : { kind: "product", index: block }),
                  onRedo: redo,
                  onTestimonial: (index) => setSheet({ kind: "testimonial", index }),
                  busy: busyBlock,
                  disabled: blocked,
                  taps: initial?.taps,
                }
          }
        />
      </div>

      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-zinc-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={redoAll} disabled={blocked} className="h-12 flex-1 rounded-xl border border-zinc-300 font-medium disabled:opacity-40">
          Redo all
        </button>
        <button type="button" onClick={publish} disabled={blocked} className="h-12 flex-[2] rounded-xl bg-zinc-900 font-medium text-white disabled:opacity-40">
          {publishing ? "Publishing…" : "Publish"}
        </button>
      </div>

      {sheet?.kind === "header" && store && (
        <HeaderSheet
          store={store}
          onClose={() => setSheet(null)}
          onRewrite={(field, draft) => rewrite("bio", field, draft)}
          onSave={(next) => {
            if (next.bio !== store.bio) setEdited(true);
            setStore({ ...store, ...next });
            setSheet(null);
          }}
        />
      )}
      {sheet?.kind === "product" && store && (
        <ProductSheet
          store={store}
          index={sheet.index}
          onClose={() => setSheet(null)}
          onRewrite={(field, draft) => rewrite(sheet.index, field, draft)}
          onSave={(next) => {
            if (JSON.stringify(next) !== JSON.stringify(store.products[sheet.index])) setEdited(true);
            setStore({ ...store, products: store.products.map((p, i) => (i === sheet.index ? next : p)) });
            setSheet(null);
          }}
        />
      )}
      {sheet?.kind === "testimonial" && store && (
        <TestimonialSheet
          initial={sheet.index === null ? null : (store.testimonials?.[sheet.index] ?? null)}
          onClose={() => setSheet(null)}
          onSave={(next) => {
            const list = store.testimonials ?? [];
            setStore({ ...store, testimonials: sheet.index === null ? [...list, next] : list.map((t, i) => (i === sheet.index ? next : t)) });
            setSheet(null);
          }}
          onRemove={
            sheet.index === null
              ? undefined
              : () => {
                  setStore({ ...store, testimonials: (store.testimonials ?? []).filter((_, i) => i !== sheet.index) });
                  setSheet(null);
                }
          }
        />
      )}
      {sheet?.kind === "published" && published && <PublishedSheet slug={published.slug} token={published.token} onClose={() => setSheet(null)} />}
    </section>
  );
}

function ThemePicker({ value, onChange, disabled }: { value: ThemeId; onChange: (theme: ThemeId) => void; disabled: boolean }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">Colour theme</legend>
      <div role="radiogroup" aria-label="Colour theme" className="grid grid-cols-4 gap-2">
        {THEME_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            disabled={disabled}
            onClick={() => onChange(id)}
            style={{ backgroundColor: THEMES[id].bg }}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-medium disabled:opacity-40 ${value === id ? "border-zinc-900 ring-2 ring-zinc-900" : "border-zinc-300"}`}
          >
            <span aria-hidden className="size-5 rounded-full" style={{ backgroundColor: THEMES[id].button }} />
            {THEMES[id].label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
