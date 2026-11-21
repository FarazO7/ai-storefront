# AI usage log

## 2026-11-20 — Step 1: live skeleton with one real OpenAI call

**Tool:** Claude Code (Claude Opus 5.5) in the Claude desktop app. I gave it a written brief; it showed a plan and waited for my OK before writing code.

**Goal:** a bare-bones Next.js app on Vercel with one working OpenAI call, so setup problems show up early. No storefront features yet.

### What was built
- `app/page.tsx`: question box, Ask button (disabled and showing "Thinking…" while waiting), answer area. Works at 375 px wide.
- `app/api/ask/route.ts`: `POST { question }` returns `{ answer }`. Rejects empty input and input over 500 characters. 25-second timeout, about 1,000 output tokens. Any failure returns "The AI is taking a break, please try again" and logs the real error on the server.
- `.env.example`, `.gitignore` (ignores `.env*`, keeps `.env.example`), `README.md`, `scripts/smoke.sh`.

### Key commands
- `npx create-next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --disable-git --yes`
- `npm install ai @ai-sdk/openai` (Next.js 16.4.6, AI SDK 7.0.178, @ai-sdk/openai 4.0.122)
- `npm run lint`, `npm run build`, `npm start`, `scripts/smoke.sh`
- `git init -b main`, then the first commit once every check passed

### Decisions the AI made
- Turned off create-next-app's git setup (`--disable-git`): it would have made a first commit before any checks ran.
- Followed the docs bundled in `node_modules/ai`, not memory. AI SDK 7 renamed `system` to `instructions` and added a built-in `timeout` option.
- `gpt-6-luna` is a reasoning model, and its default (medium) reasoning counts toward the 1,000-token cap. Reasoning is set to `low` so most of the cap goes to the answer.
- Added one instruction ("Reply in plain text, without Markdown formatting") so answers don't show `**` symbols on a phone.
- `maxDuration = 30` on the route, so Vercel never stops the function before the 25-second timeout.

### Verified locally
- `npm run lint` and `npm run build` pass with no errors or warnings.
- Real call: the Pune fitness-coach question got a real answer from `gpt-6-luna` (a 4-week home workout and meal plan for ₹1,499).
- Empty input and 501 characters each return a clear message (HTTP 400).
- Missing key, wrong key and a forced 25-second timeout each return the friendly message (HTTP 503); the server log shows the real cause. These tests never used or printed the real key.
- At 375 px: 16 px text, no sideways scrolling, button disabled while waiting, friendly error shown on the page.
- Before the first commit, `git status` showed `.env.local` ignored and not staged.

### Double-check
- Set a monthly budget cap on the OpenAI project: the production URL is public, so anyone who has it can trigger calls.
- In Vercel, `OPENAI_API_KEY` must be set for Production; without it every answer is the friendly error.

## 2026-11-20/21 — Step 1 on production: the key that wasn't there

- Production returned the friendly error on every question. Claude Code compared response times (failures were as fast as requests that never call OpenAI), then read Vercel's runtime logs in its built-in browser: `OpenAI API key is missing`.
- Cause: the Vercel variable was saved as `OpenAI_API_key`. Names are case-sensitive, so the app saw no key. Redeploying didn't help until the name was right.
- Fix (21 Nov): `OPENAI_API_KEY` and `OPENAI_MODEL` set for Production; the misnamed variable deleted.

## 2026-11-21 — Phase 0 (plan) and Phase 1 (thin slice)

**Brief:** the full product spec, built in phases with a stop after each. Phase 1: input → one real generation → store → publish to Redis → public page.

### What was built
- `lib/pricing.ts`: the 30-price-point research table, niche examples and break-even constants, with source comments.
- `lib/schema.ts`: Zod schemas for the request, the model's output and the saved store.
- `lib/prompt.ts`: the system prompt, built from the spec's rules and the research table. The creator's text goes inside `<creator_input>` as data.
- `lib/ai.ts`: one `generateText` call with `Output.object` (25 s timeout, 2,000 output tokens, low reasoning). Prices are clamped to the band and rounded to …49 or …99; over-long text is cut at a word.
- `/api/generate`, `/api/publish` (Upstash Redis, random 8-character link), and the public page `/s/[slug]`.
- Input screen (1,000-character counter, follower chips, optional handle and product, three "Try an example" chips), store preview with a name field, and a "Your store is live" screen with Copy link.
- Removed the Step 1 Ask page, `/api/ask` and its smoke script.

### Decisions the AI made
- Read the AI SDK 7 docs bundled in `node_modules`: structured output is `generateText`/`streamText` with `Output.object`. OpenAI's strict JSON mode is on by default and doesn't allow optional fields or length rules, so the schema uses nullable fields and lengths are checked in code.
- Pulled three small items forward into Phase 1 so the public page never looks broken: the name field, the price clamp and the button's thank-you message.
- The database was created in Washington (iad1), so the functions stay there too. Mumbai would need a new database.
- Set up Vercel together in the built-in browser: the AI added `OPENAI_MODEL` and deleted the misnamed key variable; I accepted Upstash's terms and pasted the secrets myself.

### Verified locally
- `node scripts/check-rules.ts` (price rules), `npm run lint`, `npm run build`.
- Real generations: case 1 returned a store with an ebook; cases 3 and 8 led with a 1:1 call; "fitness" returned 2 questions; gibberish was rejected.
- Publishing without a name gives a friendly message. Publishing creates a public page with the name, products, "Coming soon" and the Instagram link; tapping a button shows the thank-you.
- At 375 px: 16 px inputs, tap targets at least 44 px, no sideways scrolling.

### Double-check
- Delete the unused `OPENAI_key` variable in Vercel.
- An unknown store link shows Next's default 404 text with HTTP 200 (the page streams). The friendly 404 page comes in Phase 2.
- Test stores made during these checks are in Redis.

Phase 1 on production (21 Nov): a logged-out request opened the site (HTTP 200); a real generation took 7.4 s, publishing 0.6 s and the public page 1.3 s.

## 2026-11-21 — Phase 2 (must-haves)

### What was built
- **Streaming:** `/api/generate` sends one JSON event per line. Each block (the bio, then each product) is sent only after it passes the checks; the page shows skeletons, then "Still working…" after 10 s.
- **Retries:** main model → main model again (a repair with the errors fed back after bad output, a plain retry after a timeout) → backup model (`gpt-6-sol`) → a retry screen that keeps the input. Each attempt times out at 25 s.
- **Validation** (`lib/validate.ts`): schema, price clamp and …49/…99 rounding, lengths and duplicate formats (repair, then truncate or drop as a last resort), banned claims (never let through), rationale numbers (replaced with the research sentence). Self-check: `node scripts/check-rules.ts`.
- **States:** follow-up questions with tap options and "Other"; rejections with three example chips; the handle-only message.
- **Editor:** bottom sheets (the browser's `<dialog>`), "Rewrite with AI" on each text field, Redo per block, Redo all with a warning after edits, manual edits that survive block redos, a name required before Publish.
- **Publish:** a private edit link `/e/[slug]?t=…` (only a SHA-256 hash of the token is stored, compared in constant time; edit pages send no referrer), copy buttons, WhatsApp share, republishing keeps the same link.
- Covers drawn in code, rate limits per hashed IP (10 generations per 10 minutes, 30 redos per 10 minutes, 20 publishes per hour), input caps, a draft saved on the phone, back-button support, friendly 404 and error pages.
- `scripts/test-cases.ts`: the 12 test cases against the live API.
- Demo switch: `/?ff=<FORCE_FAIL_SECRET>&mode=timeout|invalid&scope=main|all`. Forced "invalid" adds a banned claim to the real model output so the checks reject it; forced timeouts wait the real 25 s. It never fakes a success.

### Decisions the AI made
- "Stream the result" and "validate before anything is shown" conflict, so whole validated blocks stream, not words.
- Case 12's rejection reason repeated "guarantee", which failed the banned-claim check twice before the backup passed (9.7 s). One prompt line fixed it (2.2 s, first attempt).
- "fitness" sometimes produced a store instead of questions. The prompt now prefers questions for one- or two-word inputs (2 of 2 runs asked questions afterwards).
- Measured reasoning "low" against "none" on 2 cases: "none" showed the bio in 1.3–2.0 s instead of 3.1–4.1 s, with the same rule compliance. Kept "low" pending a product decision.

### Verified locally
- Rule self-check, lint, production build.
- Test cases 1, 8, 9, 10, 11 and 12 passed against the local server.
- Forced invalid output: main fails twice, backup succeeds; with scope "all", the retry screen. Forced timeouts: retries at 25.6 s and 50.6 s, then the backup's store. A wrong secret is ignored.
- Redo bio, redo product (new format), rewrite title; publish, edit link (right and wrong token), republish (same slug), wrong token refused; the public page leaks neither the token hash nor the creator's input.
- At 375 px: editor sheets, rewrite, redo, publish sheet, handle-only message, a 1,940-character paste, back and forward, refresh restoring the draft.

### Found by the first production run, then fixed
- Case 11 (gibberish) came back as follow-up questions: the "prefer questions for short inputs" line had overreached. The prompt now decides rejection first and says gibberish is always rejected.
- The script crashed when one request's connection timed out on my network; a dropped connection now fails that case instead of stopping the run.
- Generating from the form while an older store existed showed the rejection on the old store. Problems from the form now stay on the form; only "Redo all" keeps the current store on screen. Generating from the form asks before replacing an edited store.
- The model's own "Something else" option is dropped, since the page adds "Other".
- My connection to Vercel dropped mid-response three times during test runs (`read ETIMEDOUT`, once even on case 9, which never calls the model, right after a 9-minute rate-limit wait). Vercel showed no server errors, so the script now retries a case once when the tester's connection drops and says so in its output.

### Verified on production (`node scripts/test-cases.ts https://ai-storefront-nine.vercel.app`)

| case | status | schema valid | prices in band | banned claims | latency | pass |
|---|---|---|---|---|---|---|
| 1 | ok | yes | yes | none | 4.6 s | PASS |
| 2 | ok | yes | yes | none | 3.5 s | PASS |
| 3 | ok | yes | yes | none | 4.1 s | PASS |
| 4 | ok | yes | yes | none | 3.8 s | PASS |
| 5 | ok | yes | yes | none | 4.3 s | PASS |
| 6 | ok | yes | yes | none | 4.5 s | PASS |
| 7 | ok | yes | yes | none | 4.9 s | PASS |
| 8 | ok | yes | yes | none | 11.7 s | PASS |
| 9 | rejected | yes | - | none | 0.5 s | PASS |
| 10 | needs_more_info | yes | - | none | 3.6 s | PASS |
| 11 | rejected | yes | - | none | 1.6 s | PASS |
| 12 | rejected | yes | - | none | 1.2 s | PASS |

Case 8 ran right after a 9-minute rate-limit pause and hit a cold start (Vercel logged a new instance; no retries were logged). Cases 3, 7 and 8 lead with a 1:1 call, as the audience rule requires.

Also checked on production at 375 px: the editor via an edit link (sheets, redo, republish with the same link, WhatsApp share), a name required before Publish, logged-out access, and the friendly 404 pages.

### Double-check
- Add `FORCE_FAIL_SECRET` in Vercel (Production) before recording the demo; until then the switch is off on production.

## 2026-11-21 — Phase 3 (should-haves)

### What was built
- **Editor only** (never on the public page):
  - "Why this price": the model's rationale, the format's research band (lowest, highest, middle, number of price points), the anonymised examples for that format, and the per-minute figure for calls.
  - "Based on few examples" under the price for the low-confidence formats.
  - The break-even line: "About {sales} sale(s) a month at this price would cover SuperProfile's ₹499 Creator plan, after its 5% fee", with `sales = ceil(499 / (price × 0.95))`.
- **Interest taps:** `/api/tap` adds one to a per-product counter in Redis (`taps:{slug}`, product id → count; no IP or visitor data), limited to 30 per minute per IP. The editor preview doesn't count its own taps. The edit link shows "N people tapped …" per product.
- **Link previews:** title, description, Open Graph and Twitter tags on `/s/[slug]`, and a 1200×630 image drawn in code (initials, name, "Coming soon", bio, a chip per format) at `/s/[slug]/opengraph-image`.
- **Testimonials:** up to 3, typed by the creator (name up to 50 characters, text up to 300), editable and removable, shown as "What people say". AI never writes or changes them, and a new store keeps them.
- **Launch discount:** an optional launch price set by the creator, which must be lower than the regular price. The public page shows the launch price with the regular price crossed out, and the editor shows the tip "24 of 30 products in my research show a crossed-out price".

### Decisions the AI made
- Break-even uses the launch price when one is set (the price buyers pay now).
- Limits not in the spec: up to 3 testimonials, 50 and 300 characters.
- No new setting for absolute preview-image URLs: on Vercel, Next falls back to the production URL. WhatsApp's crawler is on Next's list of bots that get the tags in the `<head>`.

### Verified locally
- A launch price above the regular price is refused (HTTP 400). The public page shows ₹599 with ₹799 crossed out and the testimonial, and none of the editor-only text or the rationale.
- Taps: two through the API and one by tapping the button in the browser were counted; an unknown product id isn't. The edit link showed the counts.
- The editor's break-even numbers match the formula (₹99 → 6 sales, ₹599 launch price → 1, ₹199 → 3); "Based on few examples" shows only for the community product.
- A request with WhatsApp's user agent gets og:title, og:description, og:image (absolute URL) and the twitter tags in the `<head>`; the image renders (1200×630 PNG).

### Verified on production
- A logged-out visit to a store with a launch price and a testimonial (HTTP 200): ₹599 with ₹799 crossed out and the testimonial, and none of the editor-only text.
- A request with WhatsApp's user agent gets og:title, og:description and twitter:card `summary_large_image` in the `<head>`. Both og:image and twitter:image point at `https://ai-storefront-nine.vercel.app/s/<slug>/opengraph-image` (the public domain, not a deployment URL that would need a login), and the image loads logged out.
- One tap counted in Redis; the edit link showed "1 person tapped" on that product and "0 people tapped" on the others.
- A real generation of case 3 still works: ok in 5.1 s, leading with a 1:1 call.

## 2026-11-22 — Phase 4a (themes)

### What was built
- Four colour themes, defined once in `lib/constants.ts`: Classic (the original look), Sunset, Ocean and Forest. Each sets the page background, the button colour, the "Coming soon" accent and link colours through CSS variables; product covers keep one colour per format.
- A row of four swatches above the editor preview. The choice is saved with the store (`theme`, missing means Classic), kept by "Redo all", and applied to the public page (full-page background) and the link-preview image.

### Decisions the AI made
- All four themes are light, so body text keeps its contrast everywhere; white button text on each theme's button colour meets the 4.5:1 minimum.
- Choosing a theme isn't counted as an edit, so "Redo all" doesn't warn about it.

### Verified locally
- Picking Ocean in the editor changed the preview background (#eff6ff), the buttons (#1d4ed8), "Coming soon" (#0e7490) and the link; the swatches are 56 px tall.
- Republishing saved `theme: "ocean"` in Redis; the public page and the preview image both used it, with no sideways scrolling at 375 px.

### Verified on production
- An unknown theme is refused (HTTP 400). Stores published with Sunset and Forest render their colours (#fff7ed with #c2410c, #f0fdf4 with #15803d), and their preview images load. Sunset checked by eye at 375 px: no sideways scrolling.

## 2026-11-22 — Phase 4b (FAQs)

### What was built
- The model's product schema now has 2 or 3 FAQs per product (question up to 80 characters, answer up to 300). The prompt says to answer only from that product's description, add no new facts, and say the creator will share details before launch when the description doesn't cover it.
- FAQ text goes through the same checks as other text: banned claims are always sent back; over-long text is sent back once, then cut at a word.
- Public page and editor preview: FAQs sit under each product's button, collapsed, with a "+" that turns into "×" when open. "Why this price" uses the same marker.
- Editor: the product sheet lists each FAQ to edit or remove. A saved product may end up with fewer than 2; generation itself must return 2 or 3 (the test script checks this).

### Decisions the AI made
- Raised the store's output cap from 2,000 to 3,500 tokens: FAQs add about 900 tokens to a 4-product store, and the old cap would cut stores off mid-answer. A 4-product store now takes about 11 s instead of about 5 s.
- Code doesn't check that answers stay within the description; the prompt does, and a spot check of a real store found no invented facts.

### Verified locally
- Cases 1 and 8 pass with the stricter schema (2 or 3 FAQs each).
- A real store's FAQs used only facts from its descriptions ("The call is 60 minutes."; "The ebook includes 30 Kerala home recipes."), and said "The creator will share details before launch" when asked about something not described.
- At 375 px: FAQs start collapsed, each question is a 44 px tap target, removing one in the sheet removes it from the card and from the published page.

### Verified on production
- `node scripts/test-cases.ts https://ai-storefront-nine.vercel.app 1 3 8 10 12`: all pass. Cases 1, 3 and 8 are valid stores with 2 or 3 FAQs per product (6.3 to 7.0 s), case 10 asks follow-up questions, case 12 is rejected.
- A store generated and published on production (case 7's input): 3 products, 6 FAQs, and the public page shows all 6 questions collapsed.

## 2026-11-22 — Phase 4c ("Ready to sell" checklist)

### What was built
- A "Ready to sell" section on the edit link only, under the store preview. Visitors never see it, and nothing in it is saved.
- Boost sales: "Make my checklist" asks the AI, in its own call, what a bump offer, an automated email and a discount coupon are, when each helps, and a suggested setup that uses this store's products and prices. The same call explains Meta Pixel and Google Analytics, each marked "Not needed to start".
- Policies: three questions (refunds and access period as tap options, contact as a short text box), then "Draft my policies" asks the AI, in a second call, for terms, refund and privacy policies. Each draft is marked "Draft: check before use" and has a Copy button.
- `/api/checklist` checks the edit link's token before any AI call (403 otherwise), shares the 30-per-10-minutes redo limit, and uses the same attempt order as the rest of the app: the main model, the main model again with the problems fed back, then the backup model.

### Decisions the AI made
- "No numbers about gains" is checked in code as well as in the prompt. Multipliers ("2x", "3 times"), "double", "triple" and percentages are sent back to the model, except a discount amount such as "10% off". They are never auto-fixed: if all three attempts break the rule, the creator sees "Please try again".
- Each policy draft is capped at 1,200 characters, and the contact the creator gave must appear in at least one draft (spacing may differ). On the last attempt, a missing contact is added to the terms instead of failing.
- The checklist reads the published store, not unsaved edits, and the section says so.
- Two prompt fixes after the first real runs. A bump offer must be the cheaper product added to a pricier one (the first run suggested the reverse). The refund and access answers may be reworded to fit the sentence (the first run wrote "available Within 7 days").
- Also fixed a React duplicate-key warning left from Phase 3: the research has two fitness courses at ₹599, so the "Why this price" examples are now keyed by position.

### Verified locally
- Real calls on a generated, published store (case 1's input). The checklist took 7.6 s and the policies 6.3 s. The setups used the store's own products and prices, with no numbers about gains. The contact appeared in the drafts as typed, for both an email and "WhatsApp +91 98765 43210".
- A wrong token is refused (403, "This edit link doesn't work any more."). A blank answer is refused before any AI call (400, "Answer all three questions first.").
- At 375 px: the tap options are 44 px tall, there's no sideways scrolling, and each draft shows its badge and Copy button.
