"use client";

import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { ChoiceChips, RadioCards } from "@/components/ui/Choice";
import { Field, Input as TextInput, Textarea } from "@/components/ui/Field";
import { Callout } from "@/components/ui/Status";
import TopBar from "@/components/ui/TopBar";
import { EXAMPLE_INPUTS, FOLLOWER_IDS, FOLLOWER_RANGES, HANDLE_ONLY_MESSAGE, HANDLE_PATTERN, LIMITS, type FollowerRange } from "@/lib/constants";
import type { Question } from "@/lib/schema";

export type Input = { description: string; followers: FollowerRange | null; handle: string; productInMind: string; instagramText: string };
export type Answer = { question: string; answer: string };
export type Notice = { kind: "questions"; questions: Question[] } | { kind: "rejected"; reason: string } | { kind: "failed"; message: string };

const OTHER = "__other__";

function ExampleChips({ onPick }: { onPick: (example: (typeof EXAMPLE_INPUTS)[number]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXAMPLE_INPUTS.map((example) => (
        <Button key={example.label} variant="tertiary" size="sm" onClick={() => onPick(example)}>
          {example.label}
        </Button>
      ))}
    </div>
  );
}

function FollowUp({ questions, busy, onSubmit }: { questions: Question[]; busy: boolean; onSubmit: (answers: Answer[]) => void }) {
  const [picked, setPicked] = useState(["", ""]);
  const [otherText, setOtherText] = useState(["", ""]);
  const at = <T,>(list: T[], i: number, value: T) => list.map((item, j) => (j === i ? value : item));
  const answer = (i: number) => (picked[i] === OTHER ? otherText[i].trim() : picked[i]);
  const ready = questions.every((_, i) => answer(i) !== "");

  return (
    <div className="flex flex-col gap-5 rounded-card bg-surface-accent p-4">
      <p className="text-body font-semibold">Two quick questions, so we can pick the right products</p>
      {questions.map((q, i) => (
        <div key={q.question} className="flex flex-col gap-2">
          <ChoiceChips
            name={`follow-up-${i}`}
            legend={q.question}
            options={[...q.options.map((option) => ({ value: option, label: option })), { value: OTHER, label: "Other" }]}
            value={picked[i] || null}
            onChange={(value) => setPicked(at(picked, i, value))}
          />
          {picked[i] === OTHER && (
            <TextInput
              aria-label={`Your answer: ${q.question}`}
              value={otherText[i]}
              onChange={(e) => setOtherText(at(otherText, i, e.target.value))}
              maxLength={LIMITS.answer}
              placeholder="Type your answer"
            />
          )}
        </div>
      ))}
      <Button size="lg" disabled={!ready || busy} onClick={() => onSubmit(questions.map((q, i) => ({ question: q.question, answer: answer(i) })))}>
        Continue
      </Button>
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
  // Open at first if an optional field already has text; after that only the creator opens or closes it.
  const [optionalOpen] = useState(() => input.handle !== "" || input.productInMind !== "" || input.instagramText !== "");
  const pickExample = (example: (typeof EXAMPLE_INPUTS)[number]) => set({ description: example.description, followers: example.followers });
  const tooLong = input.description.length > LIMITS.description;
  const handleInvalid = input.handle.trim() !== "" && !HANDLE_PATTERN.test(input.handle.trim());
  const handleOnly = input.description.trim() === "" && input.handle.trim() !== "";
  const canGenerate = input.description.trim() !== "" && input.followers !== null && !tooLong && !handleInvalid && !busy;

  return (
    <div className="pb-10">
      <div className="bg-(image:--hero-mesh) pb-16 text-text-inverted">
        <TopBar onHero />
        <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-4 pt-6 text-center md:pt-10">
          <h1 className="text-hero font-semibold">Create your store</h1>
          <p className="text-body">Write a few lines about what you do. AI drafts products and prices you can edit and share.</p>
        </div>
      </div>

      <section aria-label="Your details" className="relative mx-auto -mt-12 w-full max-w-md px-4">
        <div className="flex flex-col gap-6 rounded-float border border-stroke-primary bg-surface-1 p-5 shadow-raised">
          {hasStore && (
            <Button variant="link" size="sm" iconRight={<ArrowRight aria-hidden />} onClick={onBackToStore} className="-ml-3 self-start">
              Back to your store
            </Button>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-ui font-medium text-text-2">Try an example</p>
            <ExampleChips onPick={pickExample} />
          </div>

          <Field label="What do you do?" htmlFor="describe" error={tooLong ? "Please keep it under 1,000 characters." : undefined}>
            <Textarea
              id="describe"
              value={input.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={5}
              limit={LIMITS.description}
              counter
              invalid={tooLong}
              placeholder="I teach home workouts to working women. Most followers are 25 to 35."
            />
          </Field>

          <RadioCards
            name="followers"
            legend="How many followers do you have?"
            options={FOLLOWER_IDS.map((id) => ({ value: id, label: FOLLOWER_RANGES[id] }))}
            value={input.followers}
            onChange={(followers) => set({ followers })}
          />

          <details open={optionalOpen || undefined} className="group/more">
            <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-1 rounded-card text-ui font-medium text-text-accent [&::-webkit-details-marker]:hidden">
              Add more (optional)
              <ChevronDown aria-hidden className="size-4 transition-transform duration-(--duration-base) group-open/more:rotate-180" />
            </summary>
            <div className="flex flex-col gap-4 pt-2">
              <Field label="Instagram handle" htmlFor="handle" error={handleInvalid ? "Use letters, numbers, dots and underscores (max 30)." : undefined}>
                <TextInput
                  id="handle"
                  value={input.handle}
                  onChange={(e) => set({ handle: e.target.value })}
                  placeholder="@yourhandle"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={31}
                  invalid={handleInvalid}
                />
              </Field>
              <Field label="Paste your Instagram bio or a recent caption" htmlFor="instagram-text">
                <Textarea
                  id="instagram-text"
                  value={input.instagramText}
                  onChange={(e) => set({ instagramText: e.target.value })}
                  rows={3}
                  maxLength={LIMITS.instagramText}
                  counter
                />
              </Field>
              <Field label="Product in mind" htmlFor="product-in-mind">
                <TextInput
                  id="product-in-mind"
                  value={input.productInMind}
                  onChange={(e) => set({ productInMind: e.target.value })}
                  maxLength={LIMITS.productInMind}
                  counter
                  placeholder="e.g. A 4-week beginner plan"
                />
              </Field>
            </div>
          </details>

          {handleOnly && <Callout role="status">{HANDLE_ONLY_MESSAGE}</Callout>}
          {notice?.kind === "questions" && (
            <FollowUp key={notice.questions.map((q) => q.question).join("|")} questions={notice.questions} busy={busy} onSubmit={onAnswers} />
          )}
          {notice?.kind === "rejected" && (
            <Callout
              tone="warning"
              role="alert"
              action={
                <div className="flex flex-col gap-2">
                  <p className="font-medium">Or try an example:</p>
                  <ExampleChips onPick={pickExample} />
                </div>
              }
            >
              {notice.reason}
            </Callout>
          )}
          {notice?.kind === "failed" && (
            <Callout
              tone="critical"
              role="alert"
              action={
                <Button size="sm" onClick={onRetry} disabled={!canGenerate}>
                  Try again
                </Button>
              }
            >
              {notice.message} Your details are still here.
            </Callout>
          )}

          <div className="flex flex-col gap-2">
            <Button cta className="w-full" icon={<Sparkles aria-hidden />} onClick={onGenerate} disabled={!canGenerate && !busy} loading={busy}>
              {busy ? "Building your store…" : "Generate"}
            </Button>
            {!busy && input.description.trim() && !input.followers && <p className="text-center text-ui text-text-2">Pick your follower range to continue.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
