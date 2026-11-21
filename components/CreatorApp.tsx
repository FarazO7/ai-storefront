"use client";

import { useState } from "react";
import StoreView from "@/components/StoreView";
import { EXAMPLE_INPUTS, FOLLOWER_IDS, FOLLOWER_RANGES, HANDLE_PATTERN, LIMITS, type FollowerRange } from "@/lib/constants";
import type { GenerateResponse, Question, Store } from "@/lib/schema";

const AI_ERROR = "The AI is taking a break. Please try again.";
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

export default function CreatorApp() {
  const [description, setDescription] = useState("");
  const [followers, setFollowers] = useState<FollowerRange | null>(null);
  const [handle, setHandle] = useState("");
  const [productInMind, setProductInMind] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  const cleanHandle = handle.trim().replace(/^@/, "");
  const handleInvalid = handle.trim() !== "" && !HANDLE_PATTERN.test(handle.trim());
  const tooLong = description.length > LIMITS.description;
  const canGenerate = description.trim() !== "" && followers !== null && !tooLong && !handleInvalid && !busy;

  async function generate() {
    setBusy(true);
    setNotice(null);
    setQuestions(null);
    const data = await post<GenerateResponse>(
      "/api/generate",
      { description, followers, handle: cleanHandle || undefined, productInMind: productInMind.trim() || undefined },
      AI_ERROR,
    );
    setBusy(false);
    if ("error" in data) setNotice(data.error);
    else if (data.status === "rejected") setNotice(data.reason);
    else if (data.status === "needs_more_info") setQuestions(data.questions);
    else setStore({ name: "", handle: cleanHandle || null, ...data.store });
  }

  async function publish() {
    if (!store) return;
    setBusy(true);
    setNotice(null);
    const data = await post<{ slug: string }>("/api/publish", store, PUBLISH_ERROR);
    setBusy(false);
    if ("error" in data) setNotice(data.error);
    else setSlug(data.slug);
  }

  if (slug) return <Published slug={slug} />;

  if (store) {
    return (
      <section className="flex flex-col gap-6">
        <label className="flex flex-col gap-1">
          <span className="font-medium">Your name (shown on your store)</span>
          <input
            value={store.name}
            onChange={(e) => setStore({ ...store, name: e.target.value })}
            maxLength={LIMITS.name}
            placeholder="Add your name"
            autoComplete="name"
            className="h-12 rounded-xl border border-zinc-300 px-3 text-base"
          />
        </label>
        <StoreView store={store} />
        {notice && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-amber-900">{notice}</p>}
        {!store.name.trim() && <p className="text-center text-sm text-zinc-500">Add your name at the top to publish.</p>}
        <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-zinc-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => {
              setStore(null);
              setNotice(null);
            }}
            className="h-12 flex-1 rounded-xl border border-zinc-300 font-medium"
          >
            Start over
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={busy || !store.name.trim()}
            className="h-12 flex-[2] rounded-xl bg-zinc-900 font-medium text-white disabled:opacity-40"
          >
            {busy ? "Publishing…" : "Publish"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Create your store</h1>
        <p className="mt-1 text-zinc-600">Write a few lines about what you do. AI drafts products and prices you can share.</p>
      </header>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-600">Try an example</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_INPUTS.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => {
                setDescription(example.description);
                setFollowers(example.followers);
              }}
              className="h-11 rounded-full border border-zinc-300 px-4 text-sm"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-medium">What do you do?</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="I teach home workouts to working women. Most followers are 25 to 35."
          className="rounded-xl border border-zinc-300 p-3 text-base"
        />
        <span className={`self-end text-sm ${tooLong ? "text-red-700" : "text-zinc-500"}`}>
          {description.length.toLocaleString("en-IN")} / 1,000
        </span>
        {tooLong && <span className="text-sm text-red-700">Please keep it under 1,000 characters.</span>}
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-medium">How many followers do you have?</legend>
        <div role="radiogroup" aria-label="Followers" className="grid grid-cols-2 gap-2">
          {FOLLOWER_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={followers === id}
              onClick={() => setFollowers(id)}
              className={`h-11 rounded-xl border text-sm font-medium ${followers === id ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white"}`}
            >
              {FOLLOWER_RANGES[id]}
            </button>
          ))}
        </div>
      </fieldset>

      <details className="rounded-xl border border-zinc-300 px-3">
        <summary className="min-h-12 cursor-pointer py-3 font-medium">Add more (optional)</summary>
        <div className="flex flex-col gap-4 pb-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Instagram handle</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@yourhandle"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="h-12 rounded-xl border border-zinc-300 px-3 text-base"
            />
            {handleInvalid && <span className="text-sm text-red-700">Use letters, numbers, dots and underscores (max 30).</span>}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Product in mind</span>
            <input
              value={productInMind}
              onChange={(e) => setProductInMind(e.target.value)}
              maxLength={LIMITS.productInMind}
              placeholder="e.g. A 4-week beginner plan"
              className="h-12 rounded-xl border border-zinc-300 px-3 text-base"
            />
          </label>
        </div>
      </details>

      {notice && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-amber-900">{notice}</p>}
      {questions && (
        <div role="status" className="rounded-xl bg-sky-50 p-3 text-sky-950">
          <p className="font-medium">Tell us a little more:</p>
          <ul className="mt-1 list-disc pl-5">
            {questions.map((q) => (
              <li key={q.question}>{q.question}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm">Add your answers to the box above, then tap Generate again.</p>
        </div>
      )}

      <button
        type="button"
        onClick={generate}
        disabled={!canGenerate}
        className="h-12 rounded-xl bg-zinc-900 font-medium text-white disabled:opacity-40"
      >
        {busy ? "Building your store…" : "Generate"}
      </button>
      {busy && <p role="status" className="text-center text-sm text-zinc-500">This usually takes 10 to 20 seconds.</p>}
      {!busy && description.trim() && !followers && (
        <p className="text-center text-sm text-zinc-500">Pick your follower range to continue.</p>
      )}
    </section>
  );
}

function Published({ slug }: { slug: string }) {
  const url = `${window.location.origin}/s/${slug}`;
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Your store is live 🎉</h1>
      <p className="text-zinc-700">Share this link with your followers.</p>
      <p className="break-all rounded-xl bg-zinc-100 p-3 text-sm">{url}</p>
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(url).then(() => setCopy("copied"), () => setCopy("failed"))}
        className="h-12 rounded-xl bg-zinc-900 font-medium text-white"
      >
        {copy === "copied" ? "Copied!" : "Copy link"}
      </button>
      {copy === "failed" && <p className="text-sm text-zinc-600">Couldn&apos;t copy. Press and hold the link above to copy it.</p>}
      <a href={url} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center rounded-xl border border-zinc-300 font-medium">
        Open my store
      </a>
    </section>
  );
}
