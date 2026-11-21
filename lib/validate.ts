import { LIMITS } from "./constants.ts";
import { CALL_RUPEES_PER_MINUTE, EXAMPLES, FORMATS, type Format } from "./pricing.ts";

// The spec's checks run after the model and before anything is shown:
// price and rationale numbers are always fixed silently; lengths, duplicate formats and the
// button label are sent back for one repair, then fixed as a last resort; banned claims are never fixed.

export type Checked<T> = { value: T; problems: string[] };

export type ProductDraft = {
  format: Format;
  title: string;
  price: number;
  rationale: string;
  description: string;
  buttonLabel: string;
  fromCreator: boolean;
  faqs: { question: string; answer: string }[];
};

/** Clamp into the format's band, then move to the nearest price ending in 49 or 99 inside the band (ties go down). */
export function fixPrice(format: Format, price: number): number {
  const { lowest, highest } = FORMATS[format];
  const clamped = Math.min(Math.max(Math.round(price), lowest), highest);
  let best = clamped;
  let bestDistance = Infinity;
  for (let hundred = Math.floor(lowest / 100) * 100; hundred <= highest; hundred += 100) {
    for (const candidate of [hundred + 49, hundred + 99]) {
      if (candidate < lowest || candidate > highest) continue;
      const distance = Math.abs(candidate - clamped);
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }
  }
  return best;
}

/** Last-resort shortening: cut at the last space that keeps the text within `max` characters. */
export function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const lastSpace = text.slice(0, max + 1).lastIndexOf(" ");
  return (lastSpace > 0 ? text.slice(0, lastSpace) : text.slice(0, max)).trimEnd();
}

const BANNED_CLAIMS: [RegExp, string][] = [
  [/\bguarantee[ds]?\b/i, "guarantee"],
  [/100\s?%/, "100%"],
  [/\brisk[\s-]?free\b/i, "risk-free"],
  [/\bcure[sd]?\b/i, "cure"],
  [/\b\d+(\.\d+)?\s*(x|%|percent)?\s*returns?\b|\breturns?\s+(of\s+)?\d/i, "returns next to a number"],
  [/\bdouble your money\b/i, "double your money"],
  [/\blose\s+\d+(\.\d+)?\s*(kg|kgs|kilos?)\b/i, "lose X kg"],
];

export function findBannedClaims(text: string): string[] {
  return BANNED_CLAIMS.filter(([pattern]) => pattern.test(text)).map(([, label]) => label);
}

function allowedNumbers(format: Format): Set<number> {
  const band = FORMATS[format];
  const numbers = [band.lowest, band.median, band.highest, band.n];
  for (const examples of Object.values(EXAMPLES)) {
    for (const [exampleFormat, price, detail] of examples) {
      if (exampleFormat === format) numbers.push(price, ...(detail.match(/\d+(\.\d+)?/g) ?? []).map(Number));
    }
  }
  if (format === "call") numbers.push(CALL_RUPEES_PER_MINUTE.median, CALL_RUPEES_PER_MINUTE.lowest, CALL_RUPEES_PER_MINUTE.highest);
  return new Set(numbers);
}

const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

/** Every number in the rationale must come from the band table or that format's examples; otherwise use the spec's sentence. */
export function fixRationale(format: Format, rationale: string): string {
  const allowed = allowedNumbers(format);
  const numbers = rationale.replace(/1:1/g, "").match(/\d[\d,]*(\.\d+)?/g) ?? [];
  if (numbers.every((n) => allowed.has(Number(n.replace(/,/g, ""))))) return rationale;
  const band = FORMATS[format];
  return `${band.plural} in my research sell for ${rupees(band.lowest)} to ${rupees(band.highest)}; the middle is ${rupees(band.median)}.`;
}

function checkText(label: string, text: string, max: number, lastResort: boolean, problems: string[]): string {
  const trimmed = text.trim();
  for (const claim of findBannedClaims(trimmed)) problems.push(`${label} contains a banned claim ("${claim}")`);
  if (!trimmed) problems.push(`${label} is empty`);
  if (trimmed.length <= max) return trimmed;
  if (lastResort) return truncateAtWord(trimmed, max);
  problems.push(`${label} is ${trimmed.length} characters; the limit is ${max}`);
  return trimmed;
}

export function checkBio(bio: string, lastResort: boolean): Checked<string> {
  const problems: string[] = [];
  return { value: checkText("bio", bio, LIMITS.bio, lastResort, problems), problems };
}

/** Returns null as the value when a duplicate format is dropped (the last resort for duplicates). */
export function checkProduct<T extends ProductDraft>(
  product: T,
  earlierFormats: Format[],
  index: number,
  lastResort: boolean,
): Checked<T | null> {
  const problems: string[] = [];
  const label = `product ${index + 1}`;
  if (earlierFormats.includes(product.format)) {
    if (lastResort) return { value: null, problems };
    problems.push(`${label} repeats the format "${product.format}"; every product needs a different format`);
  }
  let buttonLabel = checkText(`${label} buttonLabel`, product.buttonLabel, LIMITS.buttonLabel, lastResort, problems);
  if (/\bbuy\b/i.test(buttonLabel)) {
    if (lastResort) buttonLabel = "Notify me";
    else problems.push(`${label} buttonLabel must be an interest action such as "Notify me", never "Buy"`);
  }
  const value = {
    ...product,
    title: checkText(`${label} title`, product.title, LIMITS.title, lastResort, problems),
    description: checkText(`${label} description`, product.description, LIMITS.productDescription, lastResort, problems),
    buttonLabel,
    price: fixPrice(product.format, product.price),
    rationale: checkText(`${label} rationale`, fixRationale(product.format, product.rationale.trim()), LIMITS.rationale, lastResort, problems),
    faqs: product.faqs.map((faq, j) => ({
      question: checkText(`${label} FAQ ${j + 1} question`, faq.question, LIMITS.faqQuestion, lastResort, problems),
      answer: checkText(`${label} FAQ ${j + 1} answer`, faq.answer, LIMITS.faqAnswer, lastResort, problems),
    })),
  };
  return { value, problems };
}

/** A field rewrite: same banned-claim and length rules as its block. */
export function checkField(field: "bio" | "title" | "description" | "buttonLabel", text: string, lastResort: boolean): Checked<string> {
  const max = { bio: LIMITS.bio, title: LIMITS.title, description: LIMITS.productDescription, buttonLabel: LIMITS.buttonLabel }[field];
  const problems: string[] = [];
  let value = checkText(field, text, max, lastResort, problems);
  if (field === "buttonLabel" && /\bbuy\b/i.test(value)) {
    if (lastResort) value = "Notify me";
    else problems.push(`buttonLabel must be an interest action such as "Notify me", never "Buy"`);
  }
  return { value, problems };
}

type ModelOutput = {
  status: "ok" | "needs_more_info" | "rejected";
  questions: { question: string; options: string[] }[] | null;
  reason: string | null;
  store: { bio: string; products: ProductDraft[] } | null;
};

export type CheckedResult =
  | { status: "ok"; store: { bio: string; products: ProductDraft[] } }
  | { status: "needs_more_info"; questions: { question: string; options: string[] }[] }
  | { status: "rejected"; reason: string };

/** Whole-response checks, on top of the block checks. `followUp` is true when the creator already answered questions. */
export function checkOutput(output: ModelOutput, lastResort: boolean, followUp: boolean): Checked<CheckedResult | null> {
  const problems: string[] = [];

  if (output.status === "rejected") {
    const reason = checkText("reason", output.reason ?? "", LIMITS.reason, lastResort, problems);
    return { value: problems.length ? null : { status: "rejected", reason }, problems };
  }

  if (output.status === "needs_more_info") {
    if (followUp) problems.push('The creator already answered follow-up questions: return status "ok" with a store (or "rejected"), not more questions');
    const questions = (output.questions ?? []).map((q, i) => ({
      question: checkText(`question ${i + 1}`, q.question, LIMITS.question, lastResort, problems),
      // The page adds its own "Other" choice, so the model's catch-alls are dropped.
      options: q.options
        .filter((option) => !/^(other|others|something else|anything else)$/i.test(option.trim()))
        .map((option, j) => checkText(`question ${i + 1} option ${j + 1}`, option, LIMITS.option, lastResort, problems))
        .slice(0, 4),
    }));
    if (questions.length !== 2) problems.push("needs_more_info must have exactly 2 questions");
    return { value: problems.length ? null : { status: "needs_more_info", questions }, problems };
  }

  if (!output.store) return { value: null, problems: ['status "ok" needs a store'] };
  const bio = checkBio(output.store.bio, lastResort);
  problems.push(...bio.problems);
  const products: ProductDraft[] = [];
  output.store.products.forEach((product, i) => {
    const checked = checkProduct(product, products.map((p) => p.format), i, lastResort);
    problems.push(...checked.problems);
    if (checked.value) products.push(checked.value);
  });
  if (products.length < 2) problems.push("The store needs 2 to 4 products, each in a different format");
  return { value: problems.length ? null : { status: "ok", store: { bio: bio.value, products } }, problems };
}
