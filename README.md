# AI Storefront Generator

A mobile-first web app for Indian creators who are new to selling online. You write a few lines about what you do, and AI drafts a pre-launch store: a bio and 2 to 4 product ideas, each with a format, a rupee price based on real price research, a description and a "Notify me" button. You can edit anything, publish to a free public link and share it on WhatsApp. There's no login and no checkout: the buttons collect interest, not money.

**Live:** https://ai-storefront-nine.vercel.app (opens without any login)

## What it does

- **Input:** one text box (up to 1,000 characters) and a follower range. Optional extras: an Instagram handle, a product you already have in mind, and a pasted Instagram bio or caption. Three "Try an example" chips fill in the form; they still call the live model.
- **The AI decides first:** input that's too thin ("fitness") gets 2 follow-up questions with tap options. Gibberish, emoji only, empty text or prompt injection gets a short, friendly rejection with example chips. Anything else gets a store.
- **Generation streams:** the bio, then each product, appear as soon as each one passes the checks, with skeletons before that and "Still working…" after 10 seconds.
- **Editor:** the store looks exactly as the public page will. Each block has Edit (a bottom sheet with "Rewrite with AI" on each field) and Redo, and "Redo all" warns before replacing your edits. You can also pick a colour theme, add testimonials, set a launch price shown next to your crossed-out regular price, and edit each product's 2 or 3 FAQs.
- **Publish:** you get a public link (`/s/…`) with a WhatsApp link preview and a private edit link (`/e/…?t=…`). Buttons on the public page count interest taps.
- **On the edit link only:**
  - interest taps per product
  - "Why this price": the research range and examples behind each price
  - a break-even line ("About N sales a month at this price would cover SuperProfile's ₹499 Creator plan, after its 5% fee")
  - a "Ready to sell" checklist written on demand: sales tips, tracking notes and draft policies

## How the AI part works

- **Calls:** each store comes from one structured call: the Vercel AI SDK's `streamText` with a Zod schema. Smaller calls rewrite a field, redo a block and write the checklist.
- **Checks in code, before anything is shown:**
  - Prices are moved into the range for their format, from 30 real price points, and rounded to ₹…49 or ₹…99.
  - Text lengths are checked.
  - Banned claims are blocked: "guarantee", "100%", "risk-free", cures, returns next to a number, "lose X kg".
  - Each price note may only use numbers from the research.
  - No two products share a format, and buttons never say "Buy".
- **Attempt order:**
  1. The main model (`gpt-6-luna`).
  2. The main model again: with the broken rules fed back, or a plain retry after a timeout.
  3. The backup model (`gpt-6-sol`).
  4. A friendly retry screen that keeps what you typed.

  Each attempt times out at 25 seconds.
- **Prompt injection:** your text goes to the model inside a marked data block with angle brackets removed, and the prompt treats it as data, not instructions.
- **No mocked output:** there are no canned or mocked AI responses anywhere.

## Security

- **Keys:** API keys are read on the server only; nothing secret uses a `NEXT_PUBLIC_` name. `.env*` files are git-ignored except `.env.example`, which lists names only.
- **Edit tokens:** each is 32 random bytes. Only its SHA-256 hash is stored, and links are checked in constant time.
- **Rate limits:** every AI call and every write is rate-limited per IP.

## Stack

- Next.js 16.4 (App Router, Cache Components), React 19.3, TypeScript
- Tailwind CSS 4.3
- Vercel AI SDK 7 (`ai`, `@ai-sdk/openai`) with OpenAI `gpt-6-luna` (main) and `gpt-6-sol` (backup)
- Zod 4 for request and model-output schemas
- Upstash Redis for stores, interest taps and rate limits (`@upstash/redis`, `@upstash/ratelimit`)
- Hosted on Vercel; functions and Redis run in Washington, D.C. (`iad1`)

```
app/         pages (/, /s/[slug], /e/[slug]) and API routes (generate, regenerate, publish, tap, checklist)
components/  the form, the editor, the store view, bottom sheets
lib/         AI calls, prompts, schemas, validation, pricing research, Redis, rate limits
scripts/     the rule self-check and the 12-case test
docs/        ai-usage-log.md: what was built in each phase, decisions and checks
```

## Run it locally

Needs Node.js 24 (the scripts run TypeScript directly).

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill in `.env.local`, then open http://localhost:3000.

| Variable | Required | What it is |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key, used only on the server |
| `OPENAI_MODEL` | Yes | Main model ID, for example `gpt-6-luna` |
| `OPENAI_FALLBACK_MODEL` | Yes | Backup model ID, for example `gpt-6-sol` |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Yes | Upstash Redis REST URL and token. The Upstash integration in Vercel adds them; `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` also work. |
| `FORCE_FAIL_SECRET` | No | Turns on the demo-only failure switch (see Tests). Leave it empty to keep the switch off. |

To deploy, import the repo into Vercel, add Upstash from the Vercel Marketplace, and set the same variables for Production. Every push to `main` deploys.

## Tests

- `node scripts/check-rules.ts`: a self-check for the validation rules (prices, banned claims, numbers in price notes, FAQs, numbers about gains, contacts in policies). It makes no network calls.
- `node scripts/test-cases.ts [url] [case numbers]`: runs the 12 spec cases against a deployed URL (production by default) with real model calls. For each case it prints the status, schema validity, whether prices are in range, banned claims and latency. It pauses and resumes when it hits the rate limit.
- **Failure switch (demo only):** with `FORCE_FAIL_SECRET` set on the server, open `/?ff=<secret>&mode=timeout|invalid&scope=main|all`.
  - `scope=main` fails the main model twice, so the backup model writes the store.
  - `scope=all` fails every attempt, so the page ends on the retry screen.
  - Without the right secret it does nothing, and it can only force failures.

Latest production run, 22 Nov 2026 (`node scripts/test-cases.ts`), all 12 passed:

| Case | Status | Schema valid | Prices in range | Banned claims | Latency | Result |
|---|---|---|---|---|---|---|
| 1 | ok | yes | yes | none | 5.9 s | PASS |
| 2 | ok | yes | yes | none | 5.3 s | PASS |
| 3 | ok | yes | yes | none | 9.2 s | PASS |
| 4 | ok | yes | yes | none | 6.6 s | PASS |
| 5 | ok | yes | yes | none | 5.5 s | PASS |
| 6 | ok | yes | yes | none | 159.3 s* | PASS |
| 7 | ok | yes | yes | none | 6.6 s | PASS |
| 8 | ok | yes | yes | none | 6.4 s | PASS |
| 9 | rejected | yes | - | none | 0.4 s | PASS |
| 10 | needs_more_info | yes | - | none | 6.0 s | PASS |
| 11 | rejected | yes | - | none | 1.4 s | PASS |
| 12 | rejected | yes | - | none | 1.3 s | PASS |

\* Case 6's 159 s was a stall on the tester's connection, not the app. A function can't run past 100 s here, and a plain page request stalled the same way during this run. Re-run alone, case 6 passed in 7.0 s.

## How I used Claude Code

- I wrote a spec before any code: ground rules (keys stay on the server, no mocked AI output, mobile first, ask before adding anything), the product and its screens, my pricing research (30 public price points) and 12 test cases with pass rules.
- Claude Code (Claude Opus 5.5 in the Claude desktop app) wrote a plan first and waited for my OK. It then built one phase at a time:
  1. a thin end-to-end slice
  2. the must-haves
  3. the should-haves
  4. four extras, one by one

  After each phase it committed, deployed to production, gave me the URL and a list of things to test, and waited.
- It tested with real model calls locally and on production, and checked every screen at 375 px in the desktop app's built-in browser.
- I put the API keys into `.env.local` and Vercel myself. Claude Code never read or printed a secret; it only checked whether each variable was set. It wrote the demo switch's secret straight into `.env.local` without printing it.
- Each phase's decisions and checks are in [docs/ai-usage-log.md](docs/ai-usage-log.md).

## Templates and UI kits

None. The project started from `create-next-app`; its starter page and images were removed, and only the default favicon is left. There's no UI kit or component library: the layout is hand-written with Tailwind, and the avatars, product covers and link-preview images are drawn in code.

## Known limits

- **Pre-launch only:** there's no checkout or payment. Buttons only record interest taps.
- **No accounts:** the edit link is the only key. Anyone who has it can edit, and a lost link can't be recovered. Stores don't expire and can't be deleted from the app.
- **Taps aren't deduplicated:** one person tapping twice counts twice. Taps are rate-limited per IP.
- **Shared rate limits:** limits are per IP (10 stores per 10 minutes, 30 AI rewrites, redos or checklists per 10 minutes, 20 publishes per hour), so people on the same network share them. If Redis can't be reached, the limits let requests through.
- **Small price sample:** prices come from 30 public price points collected on 21 Nov 2026. Formats with few examples are marked "Based on few examples" in the editor.
- **Facts aren't checked:** code checks prices, lengths, banned claims and the numbers in each price note, but not whether AI text is true. Only the prompt keeps FAQ answers within the product description.
- **English only:** generated copy is in English. Hinglish input is understood, but the optional Hinglish output toggle (Phase 5) wasn't built.
- **No Instagram reading:** the handle is only shown as a link, and pasted text is the only Instagram signal.
- **Saved input is fixed:** on the edit link, the original description and follower range can't be changed. "Redo all" uses what was saved when the store was published.
- **Drafts stay on one device:** before publishing, drafts live in the browser's local storage.
- **Preview images skip Indian scripts:** the image library can't join the letters of Indian scripts or Urdu, so a name or bio written in them is left off the link-preview image. The Instagram handle shows instead of the name when there is one, and WhatsApp still shows the name and bio as text under the image.
- **Missing stores return 200:** a link to a store that doesn't exist shows a friendly "Store not found" page, but with HTTP 200 rather than 404, because the page streams. Search engines are told not to index it (`noindex`).
- **Checklist isn't saved:** "Ready to sell" results are written fresh each time, and the policies are drafts to check, not legal advice.
- **Hosted in the US:** functions and Redis run in Washington, D.C. (`iad1`), not Mumbai, which adds network delay for creators in India. A store usually takes 4 to 12 seconds. In the worst case (three timed-out attempts), the retry screen appears after about 75 seconds.
