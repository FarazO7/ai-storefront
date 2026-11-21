import { openai } from "@ai-sdk/openai";
import { generateText, NoObjectGeneratedError, Output, streamText } from "ai";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AI_ERROR } from "./constants.ts";
import type { Format } from "./pricing.ts";
import { buildRegenerateMessage, buildUserMessage, SYSTEM_PROMPT } from "./prompt.ts";
import { modelOutputSchema, modelProductSchema, type GenerateResponse, type RegenerateRequest, type StoredInput } from "./schema.ts";
import { checkBio, checkField, checkOutput, checkProduct, type Checked, type ProductDraft } from "./validate.ts";

const TIMEOUT_MS = 25_000;

export type ForceFail = { mode: "timeout" | "invalid"; scope: "main" | "all" };

export type GenerateEvent =
  | { type: "bio"; bio: string }
  | { type: "product"; product: ProductDraft }
  | { type: "retry" }
  | { type: "done"; result: GenerateResponse }
  | { type: "error"; message: string };

type Failure = { kind: "timeout" | "invalid" | "error"; problems: string[] };

// Spec order: the main model, the main model again (a repair if the output broke the rules), then the backup model.
function attemptModels(): string[] {
  const main = process.env.OPENAI_MODEL;
  const backup = process.env.OPENAI_FALLBACK_MODEL;
  if (!main || !backup) throw new Error("OPENAI_MODEL and OPENAI_FALLBACK_MODEL must both be set");
  return [main, main, backup];
}

function describeFailure(error: unknown): Failure {
  if (NoObjectGeneratedError.isInstance(error)) {
    const cause = error.cause instanceof Error ? error.cause.message : error.message;
    return { kind: "invalid", problems: [`The JSON didn't match the schema: ${cause.slice(0, 400)}`] };
  }
  const name = error instanceof Error ? error.name : "";
  return { kind: name === "TimeoutError" || name === "AbortError" ? "timeout" : "error", problems: [] };
}

const withId = <T extends object>(item: T) => ({ ...item, id: randomUUID().slice(0, 8) });
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// Forced invalid output gets a banned claim, which the validator never lets through. It never fakes a success.
const FORCED_CLAIM = " Guaranteed results.";

const isComplete = (p: Partial<ProductDraft> | undefined): p is ProductDraft =>
  !!p && typeof p.format === "string" && typeof p.title === "string" && typeof p.price === "number" && typeof p.rationale === "string" &&
  typeof p.description === "string" && typeof p.buttonLabel === "string" && typeof p.fromCreator === "boolean";

/** Streams a store block by block. Each block is sent only after it passes the checks. */
export async function* streamStore(input: StoredInput, forceFail: ForceFail | null): AsyncGenerator<GenerateEvent> {
  const models = attemptModels();
  let failure: Failure | null = null;

  for (let attempt = 0; attempt < models.length; attempt++) {
    if (failure) yield { type: "retry" };
    const model = models[attempt];
    const lastResort = attempt > 0; // after one repair, lengths and duplicates are fixed instead of sent back
    const forced = forceFail && (forceFail.scope === "all" || attempt < 2) ? forceFail.mode : null;

    if (forced === "timeout") {
      await sleep(TIMEOUT_MS);
      failure = { kind: "timeout", problems: [] };
      console.error(`[generate] attempt ${attempt + 1} (${model}): forced timeout (FORCE_FAIL)`);
      continue;
    }
    const tamper = (bio: string) => (forced === "invalid" ? bio + FORCED_CLAIM : bio);

    const abort = new AbortController();
    const result = streamText({
      model: openai(model),
      instructions: SYSTEM_PROMPT,
      prompt: buildUserMessage(input, failure?.problems),
      output: Output.object({ schema: modelOutputSchema }),
      maxOutputTokens: 2000,
      // Reasoning tokens count toward maxOutputTokens and add time; low keeps a store inside the 25 s timeout.
      reasoning: "low",
      maxRetries: 0,
      timeout: TIMEOUT_MS,
      abortSignal: abort.signal,
    });

    let problems: string[] = [];
    let bioSent = false;
    let checkedCount = 0;
    const formats: Format[] = [];
    try {
      stream: for await (const partial of result.partialOutputStream) {
        const store = partial?.store;
        if (!store?.products) continue; // the bio is final once the products have started
        if (!bioSent && typeof store.bio === "string") {
          const bio = checkBio(tamper(store.bio), lastResort);
          if (bio.problems.length) {
            problems = bio.problems;
            break;
          }
          bioSent = true;
          yield { type: "bio", bio: bio.value };
        }
        // A product is complete once the next one has started; the last one comes with the final output.
        while (checkedCount < store.products.length - 1) {
          const product = store.products[checkedCount] as Partial<ProductDraft> | undefined;
          if (!isComplete(product)) break;
          const checked = checkProduct(product, formats, checkedCount, lastResort);
          checkedCount++;
          if (checked.problems.length) {
            problems = checked.problems;
            break stream;
          }
          if (checked.value) {
            formats.push(checked.value.format);
            yield { type: "product", product: checked.value };
          }
        }
      }
    } catch {
      // Stream errors also reject result.output, where they are classified below.
    }

    if (problems.length) {
      abort.abort();
      void result.output.then(undefined, () => {}); // the aborted attempt's rejection is expected
      failure = { kind: "invalid", problems };
      console.error(`[generate] attempt ${attempt + 1} (${model}) broke the rules:`, problems);
      continue;
    }

    let output;
    try {
      output = await result.output;
    } catch (error) {
      failure = describeFailure(error);
      console.error(`[generate] attempt ${attempt + 1} (${model}) failed:`, error);
      continue;
    }
    if (output.store && !bioSent) output.store.bio = tamper(output.store.bio);
    const checked = checkOutput(output, lastResort, Boolean(input.answers));
    if (!checked.value) {
      failure = { kind: "invalid", problems: checked.problems };
      console.error(`[generate] attempt ${attempt + 1} (${model}) broke the rules:`, checked.problems);
      continue;
    }
    const final = checked.value;
    yield {
      type: "done",
      result: final.status === "ok" ? { status: "ok", store: { bio: final.store.bio, products: final.store.products.map(withId) } } : final,
    };
    return;
  }

  console.error("[generate] all attempts failed; the page shows the retry screen");
  yield { type: "error", message: AI_ERROR };
}

async function withRetries<T, R>(
  label: string,
  schema: z.ZodType<T>,
  maxOutputTokens: number,
  prompt: (problems: string[]) => string,
  accept: (output: T, lastResort: boolean) => Checked<R | null>,
): Promise<R> {
  const models = attemptModels();
  let problems: string[] = [];
  for (let attempt = 0; attempt < models.length; attempt++) {
    try {
      const { output } = await generateText({
        model: openai(models[attempt]),
        instructions: SYSTEM_PROMPT,
        prompt: prompt(problems),
        output: Output.object({ schema }),
        maxOutputTokens,
        reasoning: "low",
        maxRetries: 0,
        timeout: TIMEOUT_MS,
      });
      const checked = accept(output, attempt > 0);
      if (checked.value !== null && !checked.problems.length) return checked.value;
      problems = checked.problems;
      console.error(`[${label}] attempt ${attempt + 1} (${models[attempt]}) broke the rules:`, problems);
    } catch (error) {
      problems = describeFailure(error).problems;
      console.error(`[${label}] attempt ${attempt + 1} (${models[attempt]}) failed:`, error);
    }
  }
  throw new Error(`${label}: all attempts failed`);
}

/** Redo one block, or rewrite one field, with the whole store as context. */
export async function regenerate({ input, store, block, field }: RegenerateRequest) {
  const prompt = (problems: string[]) => buildRegenerateMessage(input, store, block, field, problems);
  if (field) {
    const value = await withRetries("rewrite", z.object({ value: z.string() }), 500, prompt, (o, last) => checkField(field, o.value, last));
    return { value };
  }
  if (block === "bio") {
    const bio = await withRetries("redo bio", z.object({ bio: z.string() }), 1000, prompt, (o, last) => checkBio(o.bio, last));
    return { bio };
  }
  const otherFormats = store.products.filter((_, i) => i !== block).map((p) => p.format);
  const product = await withRetries("redo product", modelProductSchema, 1000, prompt, (o, last) => {
    const checked = checkProduct(o, otherFormats, block, last);
    return checked.value || checked.problems.length
      ? checked
      : { value: null, problems: [`product ${block + 1} must use a format no other product uses`] };
  });
  return { product: withId(product) };
}
