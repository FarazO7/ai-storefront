import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { randomUUID } from "node:crypto";
import { LIMITS } from "./constants.ts";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompt.ts";
import { modelOutputSchema, type GenerateRequest, type GenerateResponse } from "./schema.ts";
import { fixPrice, truncateAtWord } from "./validate.ts";

// shortcut: one attempt with no repair, retry or backup model; Phase 2 adds them.
export async function generateStore(input: GenerateRequest): Promise<GenerateResponse> {
  const modelId = process.env.OPENAI_MODEL;
  if (!modelId) throw new Error("OPENAI_MODEL is not set");

  const { output } = await generateText({
    model: openai(modelId),
    instructions: SYSTEM_PROMPT,
    prompt: buildUserMessage(input),
    output: Output.object({ schema: modelOutputSchema }),
    maxOutputTokens: 2000,
    // Reasoning tokens count toward maxOutputTokens and add time; low keeps a store within the 25 s timeout.
    reasoning: "low",
    timeout: 25_000,
  });

  if (output.status === "rejected") {
    return { status: "rejected", reason: output.reason || "Tell us in a line or two what you teach or post about." };
  }
  if (output.status === "needs_more_info") {
    if (!output.questions) throw new Error("needs_more_info without questions");
    return { status: "needs_more_info", questions: output.questions };
  }
  if (!output.store) throw new Error("ok without a store");

  return {
    status: "ok",
    store: {
      bio: truncateAtWord(output.store.bio, LIMITS.bio),
      products: output.store.products.map((product) => ({
        ...product,
        id: randomUUID().slice(0, 8),
        price: fixPrice(product.format, product.price),
        title: truncateAtWord(product.title, LIMITS.title),
        rationale: truncateAtWord(product.rationale, LIMITS.rationale),
        description: truncateAtWord(product.description, LIMITS.productDescription),
        buttonLabel: truncateAtWord(product.buttonLabel, LIMITS.buttonLabel),
      })),
    },
  };
}
