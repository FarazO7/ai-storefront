# AI Storefront Generator

A web app that turns an Indian creator's short self-description into a ready-to-publish storefront (current step: one working OpenAI call behind a simple Ask page).

## Install

Needs Node.js 22 or newer.

```bash
npm install
```

## Environment variables

Copy `.env.example` to `.env.local` and fill it in. `.env.local` is git-ignored.

| Variable | Required | Default | What it is |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes | none | Your OpenAI API key. Used only on the server. |
| `OPENAI_MODEL` | No | `gpt-6-luna` | The OpenAI model ID to call. |

## Run locally

```bash
npm run dev
```

Open http://localhost:3000.

Smoke test (empty input, 501 characters, then one real OpenAI call):

```bash
scripts/smoke.sh
```

To test a deployment, pass its URL: `scripts/smoke.sh https://your-project.vercel.app`.

## Deploy to Vercel

1. Push this repo to GitHub (a private repo is fine).
2. In Vercel, choose **Add New → Project** and import the repo. Vercel detects Next.js; keep the default build settings.
3. Under **Environment Variables**, add `OPENAI_API_KEY` and `OPENAI_MODEL` for Production.
4. Click **Deploy**. Every push to `main` redeploys automatically.
5. Open the project's production domain (`<project-name>.vercel.app`). Deployment-specific URLs ask visitors to log in to Vercel.
