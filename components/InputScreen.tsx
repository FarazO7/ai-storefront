"use client";

import { useState } from "react";
import { EXAMPLE_INPUTS, FOLLOWER_IDS, FOLLOWER_RANGES, HANDLE_ONLY_MESSAGE, HANDLE_PATTERN, LIMITS, type FollowerRange } from "@/lib/constants";
import type { Question } from "@/lib/schema";

export type Input = { description: string; followers: FollowerRange | null; handle: string; productInMind: string; instagramText: string };
export type Answer = { question: string; answer: string };
export type Notice = { kind: "questions"; questions: Question[] } | { kind: "rejected"; reason: string } | { kind: "failed"; message: string };

const primary = "h-12 rounded-xl bg-zinc-900 font-medium text-white disabled:opacity-40";
const chip = (on: boolean) => `min-h-11 rounded-full border px-4 text-sm font-medium ${on ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white"}`;

function ExampleChips({ onPick }: { onPick: (example: (typeof EXAMPLE_INPUTS)[number]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXAMPLE_INPUTS.map((example) => (
        <button key={example.label} type="button" onClick={() => onPick(example)} className={chip(false)}>
          {example.label}
        </button>
      ))}
    </div>
  );
}

function FollowUp({ questions, busy, onSubmit }: { questions: Question[]; busy: boolean; onSubmit: (answers: Answer[]) => void }) {
  const [picked, setPicked] = useState(["", ""]);
  const [other, setOther] = useState([false, false]);
  const [otherText, setOtherText] = useState(["", ""]);
  const at = <T,>(list: T[], i: number, value: T) => list.map((item, j) => (j === i ? value : item));
  const answer = (i: number) => (other[i] ? otherText[i].trim() : picked[i]);
  const ready = questions.every((_, i) => answer(i) !== "");

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-sky-50 p-4 text-sky-950">
      <p className="font-medium">Two quick questions, so we can pick the right products:</p>
      {questions.map((q, i) => (
        <fieldset key={q.question} className="flex flex-col gap-2">
          <legend className="mb-2 font-medium">{q.question}</legend>
          <div role="radiogroup" aria-label={q.question} className="flex flex-wrap gap-2">
            {q.options.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={!other[i] && picked[i] === option}
                onClick={() => {
                  setPicked(at(picked, i, option));
                  setOther(at(other, i, false));
                }}
                className={chip(!other[i] && picked[i] === option)}
              >
                {option}
              </button>
            ))}
            <button type="button" role="radio" aria-checked={other[i]} onClick={() => setOther(at(other, i, true))} className={chip(other[i])}>
              Other
            </button>
          </div>
          {other[i] && (
            <input
              aria-label={`Your answer: ${q.question}`}
              value={otherText[i]}
              onChange={(e) => setOtherText(at(otherText, i, e.target.value))}
              maxLength={LIMITS.answer}
              placeholder="Type your answer"
              className="h-12 rounded-xl border border-zinc-300 bg-white px-3 text-base"
            />
          )}
        </fieldset>
      ))}
      <button
        type="button"
        disabled={!ready || busy}
        onClick={() => onSubmit(questions.map((q, i) => ({ question: q.question, answer: answer(i) })))}
        className={primary}
      >
        Continue
      </button>
    </div>
  );
}

export default function InputScreen({ input, onChange, notice, busy, hasStore, onGenerate, onRetry, onAnswers, onBackToStore }: {
  input: Input;
  onChange: (next: Input) => void;
  notice: Notice | null;
  busy: boolean;
  hasStore: boolean;
  onGenerate: () => void;
  onRetry: () => void;
  onAnswers: (answers: Answer[]) => void;
  onBackToStore: () => void;
}) {
  const set = (patch: Partial<Input>) => onChange({ ...input, ...patch });
  const pickExample = (example: (typeof EXAMPLE_INPUTS)[number]) => set({ description: example.description, followers: example.followers });
  const tooLong = input.description.length > LIMITS.description;
  const handleInvalid = input.handle.trim() !== "" && !HANDLE_PATTERN.test(input.handle.trim());
  const handleOnly = input.description.trim() === "" && input.handle.trim() !== "";
  const canGenerate = input.description.trim() !== "" && input.followers !== null && !tooLong && !handleInvalid && !busy;

  return (
    <section className="flex flex-col gap-6">
      {hasStore && (
        <button type="button" onClick={onBackToStore} className="min-h-11 self-start font-medium text-sky-700 underline">
          Back to your store →
        </button>
      )}
      <header>
        <h1 className="text-2xl font-semibold">Create your store</h1>
        <p className="mt-1 text-zinc-600">Write a few lines about what you do. AI drafts products and prices you can edit and share.</p>
      </header>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-600">Try an example</p>
        <ExampleChips onPick={pickExample} />
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-medium">What do you do?</span>
        <textarea
          value={input.description}
          onChange={(e) => set({ description: e.target.value })}
          rows={5}
          placeholder="I teach home workouts to working women. Most followers are 25 to 35."
          className="rounded-xl border border-zinc-300 p-3 text-base"
        />
        <span className={`self-end text-sm ${tooLong ? "text-red-700" : "text-zinc-500"}`}>
          {input.description.length.toLocaleString("en-IN")} / 1,000
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
              aria-checked={input.followers === id}
              onClick={() => set({ followers: id })}
              className={`h-11 rounded-xl border text-sm font-medium ${input.followers === id ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white"}`}
            >
              {FOLLOWER_RANGES[id]}
            </button>
          ))}
        </div>
      </fieldset>

      <details open={input.handle !== "" || input.productInMind !== "" || input.instagramText !== "" || undefined} className="rounded-xl border border-zinc-300 px-3">
        <summary className="min-h-12 cursor-pointer py-3 font-medium">Add more (optional)</summary>
        <div className="flex flex-col gap-4 pb-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Instagram handle</span>
            <input
              value={input.handle}
              onChange={(e) => set({ handle: e.target.value })}
              placeholder="@yourhandle"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={31}
              className="h-12 rounded-xl border border-zinc-300 px-3 text-base"
            />
            {handleInvalid && <span className="text-sm text-red-700">Use letters, numbers, dots and underscores (max 30).</span>}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Paste your Instagram bio or a recent caption</span>
            <textarea
              value={input.instagramText}
              onChange={(e) => set({ instagramText: e.target.value })}
              rows={3}
              maxLength={LIMITS.instagramText}
              className="rounded-xl border border-zinc-300 p-3 text-base"
            />
            {/* maxLength cuts a long paste at 500, so the counter shows when that happened. */}
            <span className="self-end text-sm text-zinc-500">{input.instagramText.length} / 500</span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Product in mind</span>
            <input
              value={input.productInMind}
              onChange={(e) => set({ productInMind: e.target.value })}
              maxLength={LIMITS.productInMind}
              placeholder="e.g. A 4-week beginner plan"
              className="h-12 rounded-xl border border-zinc-300 px-3 text-base"
            />
          </label>
        </div>
      </details>

      {handleOnly && (
        <p role="status" className="rounded-xl bg-amber-50 p-3 text-amber-900">
          {HANDLE_ONLY_MESSAGE}
        </p>
      )}
      {notice?.kind === "questions" && (
        <FollowUp key={notice.questions.map((q) => q.question).join("|")} questions={notice.questions} busy={busy} onSubmit={onAnswers} />
      )}
      {notice?.kind === "rejected" && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl bg-amber-50 p-4 text-amber-950">
          <p>{notice.reason}</p>
          <p className="text-sm font-medium">Or try an example:</p>
          <ExampleChips onPick={pickExample} />
        </div>
      )}
      {notice?.kind === "failed" && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl bg-amber-50 p-4 text-amber-950">
          <p>{notice.message} Your details are still here.</p>
          <button type="button" onClick={onRetry} disabled={!canGenerate} className={primary}>
            Try again
          </button>
        </div>
      )}

      <button type="button" onClick={onGenerate} disabled={!canGenerate} className={primary}>
        {busy ? "Building your store…" : "Generate"}
      </button>
      {!busy && input.description.trim() && !input.followers && (
        <p className="text-center text-sm text-zinc-500">Pick your follower range to continue.</p>
      )}
    </section>
  );
}
