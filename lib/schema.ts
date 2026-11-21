import { z } from "zod";
import { FOLLOWER_IDS, HANDLE_PATTERN, LIMITS, THEME_IDS } from "./constants.ts";
import { FORMAT_IDS } from "./pricing.ts";

// What the page sends to /api/generate. Messages are shown to creators as written.
// An empty description is allowed here: the route answers it with "rejected" without calling the model.
export const generateRequestSchema = z.object({
  description: z.string().trim().max(LIMITS.description, "Please keep it under 1,000 characters."),
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
  answers: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(120),
        answer: z
          .string()
          .trim()
          .min(1, "Answer both questions, or pick an option.")
          .max(LIMITS.answer, "Please keep each answer under 100 characters."),
      }),
    )
    .length(2)
    .optional(),
});
export type GenerateRequest = z.infer<typeof generateRequestSchema>;

// The creator's input as saved with a store, so the edit link can redo blocks later.
export const storedInputSchema = generateRequestSchema
  .omit({ handle: true })
  .extend({ description: z.string().trim().min(1).max(LIMITS.description) });
export type StoredInput = z.infer<typeof storedInputSchema>;

// What the model must return. OpenAI strict mode allows no optional fields and no string
// length rules, so conditional fields are nullable and lengths are enforced in code.
export const modelProductSchema = z.object({
  format: z.enum(FORMAT_IDS),
  title: z.string().describe("Max 75 characters: a number, a promise and who it's for; at most one emoji"),
  price: z.number().int().describe("Whole rupees, inside the format's band"),
  rationale: z.string().describe("Max 120 characters, one line"),
  description: z.string().describe("Max 300 characters"),
  buttonLabel: z.string().describe("Max 25 characters, an interest action such as 'Notify me'; never 'Buy'"),
  fromCreator: z.boolean().describe("True only for the creator's 'product in mind'"),
  faqs: z
    .array(
      z.object({
        question: z.string().describe("Max 80 characters"),
        answer: z.string().describe("Max 300 characters, answered only from this product's description"),
      }),
    )
    .min(2)
    .max(3)
    .describe("2 or 3 questions a buyer might ask, answered only from this product's description"),
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
      products: z.array(modelProductSchema).min(2).max(4),
    })
    .nullable()
    .describe("Only for ok"),
});

export const faqSchema = z.object({
  question: z.string().trim().min(1).max(LIMITS.faqQuestion),
  answer: z.string().trim().min(1).max(LIMITS.faqAnswer),
});

// A store as the page holds it and /api/publish accepts it. Prices the creator types may sit outside the bands.
// launchPrice: an optional launch discount the creator sets; the regular price then shows crossed out. AI never sets it.
// faqs: generated 2 or 3 per product; the creator may edit or remove them, so a saved product can have fewer.
const productObject = z.object({
  id: z.string().min(1).max(20),
  format: z.enum(FORMAT_IDS),
  title: z.string().trim().min(1, "Every product needs a title.").max(LIMITS.title),
  price: z.number().int().min(1).max(LIMITS.maxPrice),
  launchPrice: z.number().int().min(1).max(LIMITS.maxPrice).optional(),
  rationale: z.string().max(LIMITS.rationale),
  description: z.string().trim().min(1).max(LIMITS.productDescription),
  buttonLabel: z.string().trim().min(1).max(LIMITS.buttonLabel),
  fromCreator: z.boolean(),
  faqs: z.array(faqSchema).max(3).optional(),
});
export const productSchema = productObject.refine(
  (p) => p.launchPrice === undefined || p.launchPrice < p.price,
  "The launch price must be lower than the regular price.",
);
// What generation itself must deliver: exactly 2 or 3 FAQs per product.
const generatedProductSchema = productObject.extend({ faqs: z.array(faqSchema).min(2).max(3) });

// Testimonials are typed by the creator, never generated.
export const testimonialSchema = z.object({
  name: z.string().trim().min(1).max(LIMITS.testimonialName),
  text: z.string().trim().min(1).max(LIMITS.testimonialText),
});

export const storeSchema = z.object({
  name: z.string().trim().min(1, "Add your name before publishing.").max(LIMITS.name),
  handle: z.string().regex(/^[A-Za-z0-9._]{1,30}$/).nullable(),
  bio: z.string().trim().min(1).max(LIMITS.bio),
  products: z.array(productSchema).min(2).max(4),
  testimonials: z.array(testimonialSchema).max(LIMITS.testimonials).optional(),
  theme: z.enum(THEME_IDS).optional(), // missing means "classic"
});

export const tapRequestSchema = z.object({ slug: z.string().regex(/^[a-z0-9]{8}$/), productId: z.string().min(1).max(20) });

export const publishRequestSchema = z.object({
  store: storeSchema,
  input: storedInputSchema,
  slug: z.string().regex(/^[a-z0-9]{8}$/).optional(),
  token: z.string().min(20).max(100).optional(),
});

export const regenerateRequestSchema = z
  .object({
    input: storedInputSchema,
    store: z.object({ bio: z.string().max(LIMITS.bio), products: z.array(productSchema).min(1).max(4) }),
    block: z.union([z.literal("bio"), z.number().int().min(0).max(3)]),
    // Present: rewrite one field. Absent: redo the whole block.
    field: z.enum(["bio", "title", "description", "buttonLabel"]).optional(),
  })
  .refine((r) => r.field === undefined || (r.block === "bio") === (r.field === "bio"), "That field isn't part of that block.")
  .refine((r) => r.block === "bio" || r.block < r.store.products.length, "That product doesn't exist.");
export type RegenerateRequest = z.infer<typeof regenerateRequestSchema>;

// What /api/generate finally sends ("done"); the test script checks results against this.
export const generateResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ok"),
    store: z
      .object({ bio: z.string().min(1).max(LIMITS.bio), products: z.array(generatedProductSchema).min(2).max(4) })
      .refine((s) => new Set(s.products.map((p) => p.format)).size === s.products.length, "Two products share a format."),
  }),
  z.object({
    status: z.literal("needs_more_info"),
    questions: z
      .array(z.object({ question: z.string().min(1).max(LIMITS.question), options: z.array(z.string().min(1).max(LIMITS.option)).max(4) }))
      .length(2),
  }),
  z.object({ status: z.literal("rejected"), reason: z.string().min(1).max(LIMITS.reason) }),
]);

export type Product = z.infer<typeof productSchema>;
export type Store = z.infer<typeof storeSchema>;
export type Testimonial = z.infer<typeof testimonialSchema>;
export type Faq = z.infer<typeof faqSchema>;
export type GenerateResponse = z.infer<typeof generateResultSchema>;
export type Question = { question: string; options: string[] };
