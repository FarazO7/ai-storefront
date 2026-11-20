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
