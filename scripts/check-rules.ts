// Self-check for the validation rules. Run: node scripts/check-rules.ts
import assert from "node:assert/strict";
import { checkOutput, checkProduct, findBannedClaims, fixPrice, fixRationale, truncateAtWord } from "../lib/validate.ts";

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
const product = { format: "ebook" as const, title: "7 Home Workout Plans", price: 120, rationale: "Ebooks sell for ₹49 to ₹799.", description: "Plans.", buttonLabel: "Notify me", fromCreator: false };
assert.equal(checkProduct(product, ["ebook"], 1, false).problems.length, 1);
assert.equal(checkProduct(product, ["ebook"], 1, true).value, null);
assert.equal(checkProduct({ ...product, buttonLabel: "Buy now" }, [], 0, true).value?.buttonLabel, "Notify me");

// A follow-up round must not ask more questions; a store with one product left fails.
const questions = [{ question: "What do you teach?", options: ["Yoga", "Other"] }, { question: "Who for?", options: ["Beginners", "Something else"] }];
assert.equal(checkOutput({ status: "needs_more_info", questions, reason: null, store: null }, false, true).value, null);
assert.deepEqual(checkOutput({ status: "needs_more_info", questions, reason: null, store: null }, false, false).value, {
  status: "needs_more_info",
  questions: [{ question: "What do you teach?", options: ["Yoga"] }, { question: "Who for?", options: ["Beginners"] }],
});
assert.equal(checkOutput({ status: "ok", questions: null, reason: null, store: { bio: "Hi", products: [product, product] } }, true, false).value, null);

console.log("All rule checks passed.");
