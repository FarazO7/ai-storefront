import { z } from "zod";
import { FOLLOWER_IDS, HANDLE_PATTERN, LIMITS } from "./constants.ts";
import { FORMAT_IDS } from "./pricing.ts";

// What the page sends to /api/generate. Messages are shown to creators as written.
export const generateRequestSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Tell us in a line or two what you do.")
    .max(LIMITS.description, "Please keep it under 1,000 characters."),
  followers: z.enum(FOLLOWER_IDS, { error: "Pick your follower range." }),
  handle: z
    .string()
    .trim()
    .regex(HANDLE_PATTERN, "Instagram handles use letters, numbers, dots and underscores (max 30).")
    .optional(),
  productInMind: z
    .string()
    .trim()
    .max(LIMITS.productInMind, "Please keep 'Product in mind' under 150 characters.")
    .optional(),
});
export type GenerateRequest = z.infer<typeof generateRequestSchema>;

// What the model must return. OpenAI strict mode allows no optional fields and no string
// length rules, so conditional fields are nullable and lengths are enforced in code.
const modelProduct = z.object({
  format: z.enum(FORMAT_IDS),
  title: z.string().describe("Max 75 characters: a number, a promise and who it's for; at most one emoji"),
  price: z.number().int().describe("Whole rupees, inside the format's band"),
  rationale: z.string().describe("Max 120 characters, one line"),
  description: z.string().describe("Max 300 characters"),
  buttonLabel: z.string().describe("Max 25 characters, an interest action such as 'Notify me'; never 'Buy'"),
  fromCreator: z.boolean().describe("True only for the creator's 'product in mind'"),
});

export const modelOutputSchema = z.object({
  status: z.enum(["ok", "needs_more_info", "rejected"]),
  questions: z
    .array(
      z.object({
        question: z.string().describe("Max 80 characters"),
        options: z.array(z.string().describe("Max 30 characters")).max(4),
      }),
    )
    .length(2)
    .nullable()
    .describe("Only for needs_more_info: exactly 2 questions"),
  reason: z.string().nullable().describe("Only for rejected: max 120 characters, friendly"),
  store: z
    .object({
      bio: z.string().describe("Max 220 characters"),
      products: z.array(modelProduct).min(2).max(4),
    })
    .nullable()
    .describe("Only for ok"),
});

// A store as the page holds it and /api/publish accepts it.
export const productSchema = z.object({
  id: z.string().min(1).max(20),
  format: z.enum(FORMAT_IDS),
  title: z.string().trim().min(1, "Every product needs a title.").max(LIMITS.title),
  price: z.number().int().min(1).max(LIMITS.maxPrice),
  rationale: z.string().max(LIMITS.rationale),
  description: z.string().trim().min(1).max(LIMITS.productDescription),
  buttonLabel: z.string().trim().min(1).max(LIMITS.buttonLabel),
  fromCreator: z.boolean(),
});

export const storeSchema = z.object({
  name: z.string().trim().min(1, "Add your name before publishing.").max(LIMITS.name),
  handle: z.string().regex(/^[A-Za-z0-9._]{1,30}$/).nullable(),
  bio: z.string().trim().min(1).max(LIMITS.bio),
  products: z.array(productSchema).min(2).max(4),
});

export type Product = z.infer<typeof productSchema>;
export type Store = z.infer<typeof storeSchema>;
export type Question = { question: string; options: string[] };

export type GenerateResponse =
  | { status: "ok"; store: { bio: string; products: Product[] } }
  | { status: "needs_more_info"; questions: Question[] }
  | { status: "rejected"; reason: string };
