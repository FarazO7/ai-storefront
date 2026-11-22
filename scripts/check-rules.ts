// Self-check for the validation rules. Run: node scripts/check-rules.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AVATAR_COLOURS, COVER_COLOURS, OG_COLOURS, THEMES } from "../lib/constants.ts";
import { checkOutput, checkPolicyDrafts, checkProduct, findBannedClaims, findGainNumbers, fixPrice, fixRationale, truncateAtWord } from "../lib/validate.ts";

// Price: clamp into the band, then the nearest ...49 or ...99 inside it.
assert.equal(fixPrice("template", 230), 249); // spec example
assert.equal(fixPrice("package", 8000), 7999); // spec example
assert.equal(fixPrice("workshop", 500), 99); // band fixed at ₹99
assert.equal(fixPrice("call", 50), 399); // clamped up into the band
assert.equal(fixPrice("ebook", 174), 149); // tie between 149 and 199 goes down
assert.equal(fixPrice("course", 600), 599);

assert.equal(truncateAtWord("one two three", 9), "one two");
assert.equal(truncateAtWord("short", 9), "short");

// Banned claims, case-insensitive.
assert.deepEqual(findBannedClaims("Guaranteed results"), ["guarantee"]);
assert.deepEqual(findBannedClaims("Earn 10x returns"), ["returns next to a number"]);
assert.deepEqual(findBannedClaims("Lose 5 kg in a month"), ["lose X kg"]);
assert.deepEqual(findBannedClaims("100% risk-free"), ["100%", "risk-free"]);
assert.deepEqual(findBannedClaims("File your GST returns on time"), []); // "returns" without a number is fine
assert.deepEqual(findBannedClaims("Pedicure tips for a secure routine"), []); // not the word "cure"

// Rationale numbers must come from the band table or that format's examples.
assert.equal(fixRationale("ebook", "Fitness ebooks sell near ₹397; the middle is ₹99."), "Fitness ebooks sell near ₹397; the middle is ₹99.");
assert.equal(fixRationale("call", "1:1 calls average ₹33 a minute."), "1:1 calls average ₹33 a minute.");
assert.equal(
  fixRationale("course", "Priced at ₹650 for 4 weeks."),
  "Recorded courses in my research sell for ₹549 to ₹2,999; the middle is ₹599.",
);

// Duplicate formats: reported on the first try, dropped as a last resort.
const product = { format: "ebook" as const, title: "7 Home Workout Plans", price: 120, rationale: "Ebooks sell for ₹49 to ₹799.", description: "Plans.", buttonLabel: "Notify me", fromCreator: false, faqs: [] };
assert.equal(checkProduct(product, ["ebook"], 1, false).problems.length, 1);
assert.equal(checkProduct(product, ["ebook"], 1, true).value, null);
assert.equal(checkProduct({ ...product, buttonLabel: "Buy now" }, [], 0, true).value?.buttonLabel, "Notify me");

// FAQs: banned claims are always sent back; long answers are sent back once, then cut at a word.
const longAnswer = "word ".repeat(70).trim(); // 349 characters
const withFaqs = { ...product, faqs: [{ question: "Is it for beginners?", answer: longAnswer }, { question: "Do results come fast?", answer: "Guaranteed results in a week." }] };
assert.deepEqual(checkProduct(withFaqs, [], 0, false).problems, [
  "product 1 FAQ 1 answer is 349 characters; the limit is 300",
  'product 1 FAQ 2 answer contains a banned claim ("guarantee")',
]);
assert.ok(checkProduct(withFaqs, [], 0, true).value!.faqs![0].answer.length <= 300);

// A follow-up round must not ask more questions; a store with one product left fails.
const questions = [{ question: "What do you teach?", options: ["Yoga", "Other"] }, { question: "Who for?", options: ["Beginners", "Something else"] }];
assert.equal(checkOutput({ status: "needs_more_info", questions, reason: null, store: null }, false, true).value, null);
assert.deepEqual(checkOutput({ status: "needs_more_info", questions, reason: null, store: null }, false, false).value, {
  status: "needs_more_info",
  questions: [{ question: "What do you teach?", options: ["Yoga"] }, { question: "Who for?", options: ["Beginners"] }],
});
assert.equal(checkOutput({ status: "ok", questions: null, reason: null, store: { bio: "Hi", products: [product, product] } }, true, false).value, null);

// "Ready to sell": no numbers about gains, but a discount amount is fine.
assert.equal(findGainNumbers("Bump offers can bring 2x more sales"), true);
assert.equal(findGainNumbers("It can lift sales by 20%"), true);
assert.equal(findGainNumbers("Coupons can double your orders"), true);
assert.equal(findGainNumbers("Offer 10% off for the first week"), false);
assert.equal(findGainNumbers("A 15% discount for early buyers"), false);
assert.equal(findGainNumbers("Add the ₹199 template at checkout"), false);

// Policy drafts must carry the creator's contact; spacing may differ, and the last attempt adds it.
const drafts = { terms: "Terms.", refund: "Refunds within 7 days.", privacy: "We use your email to deliver." };
assert.equal(checkPolicyDrafts({ ...drafts, terms: "Write to 98765 43210." }, "9876543210", false).problems.length, 0);
assert.equal(checkPolicyDrafts(drafts, "hello@example.com", false).problems.length, 1);
assert.ok(checkPolicyDrafts(drafts, "hello@example.com", true).value!.terms.endsWith("Contact: hello@example.com"));

// Store colours: the link-preview image's plain copies in lib/constants.ts must match app/tokens.css.
const tokens = readFileSync(new URL("../app/tokens.css", import.meta.url), "utf8");
for (const [id, theme] of Object.entries(THEMES)) {
  const block = tokens.match(new RegExp(`\\[data-store-theme="${id}"\\] \\{([^}]*)\\}`))?.[1] ?? "";
  for (const key of ["bg", "button", "accent", "link"] as const) assert.ok(block.includes(`--store-${key}: ${theme[key]};`), `theme ${id}: ${key}`);
}
for (const [format, [from, to]] of Object.entries(COVER_COLOURS)) {
  assert.ok(tokens.includes(`[data-cover="${format}"] { --cover: linear-gradient(to bottom right, ${from}, ${to}); }`), `cover ${format}`);
}
AVATAR_COLOURS.forEach((colour, i) => assert.ok(tokens.includes(`--avatar-${i}: ${colour};`), `avatar ${i}`));
assert.ok(!tokens.includes(`--avatar-${AVATAR_COLOURS.length}:`), "same number of avatar colours");
assert.equal(tokens.match(/--gray-900: (#\w+);/)?.[1], OG_COLOURS.ink);
assert.equal(tokens.match(/--gray-500: (#\w+);/)?.[1], OG_COLOURS.muted);
assert.equal(tokens.match(/--gray-0: (#\w+);/)?.[1], OG_COLOURS.surface);

console.log("All rule checks passed.");
