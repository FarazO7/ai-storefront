"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import DesktopEditor from "@/components/DesktopEditor";
import { HeaderForm, ProductForm, PublishedSheet, TestimonialForm, type Field } from "@/components/EditSheets";
import InputScreen, { type Answer, type Input, type Notice } from "@/components/InputScreen";
import ReadyToSell from "@/components/ReadyToSell";
import StoreView, { type Block, type EditControls } from "@/components/StoreView";
import ThemePicker from "@/components/ThemePicker";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";
import Modal from "@/components/ui/Modal";
import { Callout } from "@/components/ui/Status";
import type { GenerateEvent } from "@/lib/ai";
import { AI_ERROR } from "@/lib/constants";
import type { GenerateResponse, Product, Store, StoredInput } from "@/lib/schema";
import type { ProductDraft } from "@/lib/validate";

type Published = { slug: string; token: string };
type Generating = { bio: string | null; products: ProductDraft[]; retrying: boolean; slow: boolean };
type Sheet = { kind: "header" } | { kind: "product"; index: number } | { kind: "testimonial"; index: number | null } | { kind: "published" } | null;
type Draft = { input: Input; answers: Answer[] | null; store: Store | null; edited: boolean; published: Published | null };
type Confirm = { title: string; body: string; confirmLabel: string; onConfirm: () => void; cancelLabel?: string; danger?: boolean };

const DRAFT_KEY = "ai-storefront:draft:v1";
const EMPTY_INPUT: Input = { description: "", followers: null, handle: "", productInMind: "", instagramText: "" };
const REDO_ERROR = "The AI is taking a break. Your version is unchanged; please try again.";
const PUBLISH_ERROR = "We couldn't publish just now. Your store is still here; please try again.";
const NAME_NEEDED = "Add your name to publish.";

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

// From 992px the editor splits into a form panel and a live preview.
const DESKTOP = "(min-width: 992px)";
const subscribeDesktop = (onChange: () => void) => {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

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
      ? { description: initial.input.description, followers: initial.input.followers, handle: initial.store.handle ?? "", productInMind: initial.input.productInMind ?? "", instagramText: initial.input.instagramText ?? "" }
      : { ...EMPTY_INPUT, ...draft?.input }, // drafts saved before Phase 4d have no instagramText
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
  // The open form's unsaved draft, so the desktop preview follows each keystroke.
  const [previewDraft, setPreviewDraft] = useState<Store | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const desktop = useSyncExternalStore(subscribeDesktop, () => window.matchMedia(DESKTOP).matches, () => false);
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

  function closeSheet() {
    setSheet(null);
    setPreviewDraft(null);
  }

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
    instagramText: input.instagramText.trim() || undefined,
    answers: withAnswers ?? undefined,
  });

  // fromEditor: "Redo all" keeps the current store on screen if anything goes wrong. From the form,
  // problems (questions, rejection, failure) show on the form, next to what the creator typed.
  async function generate(withAnswers: Answer[] | null, fromEditor = false, confirmed = false) {
    if (running.current) return; // no double submits
    if (!fromEditor && edited && !confirmed) {
      setConfirm({ title: "Replace your edits?", body: "This makes a new store and replaces your edits.", confirmLabel: "Make a New Store", onConfirm: () => generate(withAnswers, false, true) });
      return;
    }
    running.current = true;
    lastAnswers.current = withAnswers;
    setNotice(null);
    setMessage(null);
    closeSheet();
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
      setMessage(NAME_NEEDED);
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
    if (!edited) return generate(answers, true);
    setConfirm({ title: "Replace your edits?", body: "Redo all replaces your edits with a new store.", confirmLabel: "Redo all", onConfirm: () => generate(answers, true) });
  }

  const confirmDialog = confirm && (
    <Modal
      title={confirm.title}
      onClose={() => setConfirm(null)}
      footer={
        <>
          <Button variant="text" size="sm" onClick={() => setConfirm(null)}>
            {confirm.cancelLabel ?? "Keep my edits"}
          </Button>
          <Button
            size="sm"
            variant={confirm.danger ? "danger" : "primary"}
            onClick={() => {
              setConfirm(null);
              confirm.onConfirm();
            }}
          >
            {confirm.confirmLabel}
          </Button>
        </>
      }
    >
      {confirm.body}
    </Modal>
  );

  if (view === "input" || (!store && !generating)) {
    return (
      <>
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
        {confirmDialog}
      </>
    );
  }

  const shown = generating
    ? { name: store?.name ?? "", handle: handle || null, bio: generating.bio ?? "", products: generating.products, theme: store?.theme }
    : store!;
  const blocked = generating !== null || busyBlock !== null || publishing;
  const editControls: EditControls = {
    onEdit: (block) => setSheet(block === "bio" ? { kind: "header" } : { kind: "product", index: block }),
    onRedo: redo,
    onTestimonial: (index) => setSheet({ kind: "testimonial", index }),
    busy: busyBlock,
    disabled: blocked,
    taps: initial?.taps,
  };
  const status = (
    <>
      {generating && (
        <Callout tone="ai" role="status">
          {generating.retrying ? "Taking longer than usual. Trying again…" : generating.slow ? "Still working…" : "Writing your store…"}
        </Callout>
      )}
      {message && (
        <Callout tone="warning" role="alert">
          {message}
        </Callout>
      )}
    </>
  );
  const readyToSell = editLink && published && !generating ? <ReadyToSell slug={published.slug} token={published.token} /> : null;

  // One open form at a time: a bottom sheet on phones, inline in the panel on desktop (with the live preview).
  const onDraft = desktop ? setPreviewDraft : undefined;
  let form: { title: string; node: ReactNode } | null = null;
  if (store && sheet?.kind === "header") {
    form = {
      title: "Your name and bio",
      node: (
        <HeaderForm
          store={store}
          onCancel={closeSheet}
          onDraft={onDraft}
          onRewrite={(field, draft) => rewrite("bio", field, draft)}
          onSave={(next) => {
            if (next.bio !== store.bio) setEdited(true);
            if (next.name.trim()) setMessage((m) => (m === NAME_NEEDED ? null : m));
            setStore({ ...store, ...next });
            closeSheet();
          }}
        />
      ),
    };
  } else if (store && sheet?.kind === "product") {
    const index = sheet.index;
    form = {
      title: `Product ${index + 1}`,
      node: (
        <ProductForm
          key={index}
          store={store}
          index={index}
          onCancel={closeSheet}
          onDraft={onDraft}
          onRewrite={(field, draft) => rewrite(index, field, draft)}
          onSave={(next) => {
            if (JSON.stringify(next) !== JSON.stringify(store.products[index])) setEdited(true);
            setStore({ ...store, products: store.products.map((p, i) => (i === index ? next : p)) });
            closeSheet();
          }}
        />
      ),
    };
  } else if (store && sheet?.kind === "testimonial") {
    const index = sheet.index;
    form = {
      title: index === null ? "Add a testimonial" : "Edit testimonial",
      node: (
        <TestimonialForm
          key={String(index)}
          store={store}
          index={index}
          onCancel={closeSheet}
          onDraft={onDraft}
          onSave={(next) => {
            const list = store.testimonials ?? [];
            setStore({ ...store, testimonials: index === null ? [...list, next] : list.map((t, i) => (i === index ? next : t)) });
            closeSheet();
          }}
          onRemove={
            index === null
              ? undefined
              : () =>
                  setConfirm({
                    title: "Remove this testimonial?",
                    body: "It comes off your store, and you'd have to type it again to get it back.",
                    confirmLabel: "Remove",
                    cancelLabel: "Keep it",
                    danger: true,
                    onConfirm: () => {
                      setStore({ ...store, testimonials: (store.testimonials ?? []).filter((_, i) => i !== index) });
                      closeSheet();
                    },
                  })
          }
        />
      ),
    };
  }
  const publishedSheet = sheet?.kind === "published" && published && <PublishedSheet slug={published.slug} token={published.token} onClose={closeSheet} />;

  if (desktop) {
    return (
      <>
        <DesktopEditor
          store={shown}
          preview={previewDraft ?? shown}
          pending={generating !== null}
          editLink={editLink}
          status={status}
          form={form && { ...form, onCancel: closeSheet }}
          onBack={showInput}
          edit={editControls}
          theme={shown.theme ?? "classic"}
          onTheme={(theme) => store && setStore({ ...store, theme })}
          readyToSell={readyToSell}
          onRedoAll={redoAll}
          onPublish={publish}
          publishing={publishing}
          blocked={blocked}
          publicUrl={published ? `${window.location.origin}/s/${published.slug}` : null}
        />
        {publishedSheet}
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-6">
        <div className="flex min-h-11 items-center">
          {editLink ? (
            <Logo />
          ) : (
            <Button variant="link" size="sm" icon={<ArrowLeft aria-hidden />} onClick={showInput} disabled={generating !== null} className="-ml-3">
              Change my details
            </Button>
          )}
        </div>
        {status}

        {!generating && store && <ThemePicker value={store.theme ?? "classic"} disabled={blocked} onChange={(theme) => setStore({ ...store, theme })} />}

        {/* The same page visitors get, edge to edge, with editing controls on each block. */}
        <div className="-mx-4">
          <StoreView store={shown} pending={generating !== null} edit={generating ? undefined : editControls} shareUrl={published ? `/s/${published.slug}` : undefined} />
        </div>

        {readyToSell}

        <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-stroke-primary bg-surface-1 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button variant="tertiary" size="lg" onClick={redoAll} disabled={blocked} className="flex-1">
            Redo all
          </Button>
          <Button size="lg" onClick={publish} disabled={blocked && !publishing} loading={publishing} className="flex-[2]">
            Publish
          </Button>
        </div>
      </section>

      {form && (
        <Modal title={form.title} onClose={closeSheet}>
          {form.node}
        </Modal>
      )}
      {publishedSheet}
      {confirmDialog}
    </>
  );
}
