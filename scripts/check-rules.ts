// Self-check for the price and text rules. Run: node scripts/check-rules.ts
import assert from "node:assert/strict";
import { fixPrice, truncateAtWord } from "../lib/validate.ts";

assert.equal(fixPrice("template", 230), 249); // spec example
assert.equal(fixPrice("package", 8000), 7999); // spec example
assert.equal(fixPrice("workshop", 500), 99); // band fixed at ₹99
assert.equal(fixPrice("call", 50), 399); // clamped up into the band
assert.equal(fixPrice("ebook", 174), 149); // tie between 149 and 199 goes down
assert.equal(fixPrice("course", 600), 599);
assert.equal(truncateAtWord("one two three", 9), "one two");
assert.equal(truncateAtWord("short", 9), "short");

console.log("All rule checks passed.");
