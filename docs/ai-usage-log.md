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
