# Claude vs Codex — public poll

A fun, anonymous poll: vote **Claude** or **Codex**, optionally post *why*, and
upvote other people's reasons. Reasons rank by upvotes on a live leaderboard.

- **Frontend:** Vite + React (static SPA)
- **Backend:** 4 Vercel serverless functions in [`/api`](./api) (no separate server to run)
- **Database:** [Turso](https://turso.tech) (hosted SQLite)

Everything deploys as **one project on Vercel** — the functions live in the same
repo and Vercel runs them for you.

## How it works

The browser can't talk to the database directly (the credentials would be public),
so the four functions are the secure bridge:

| Endpoint        | Method | Purpose                                  |
| --------------- | ------ | ---------------------------------------- |
| `/api/results`  | GET    | Tallies + reason leaderboard + your state |
| `/api/vote`     | POST   | Cast a vote (one per voter)              |
| `/api/reason`   | POST   | Post a "why" (≤ 280 chars)               |
| `/api/upvote`   | POST   | Upvote a reason (one per voter)          |

## Setup

### 1. Create the Turso database

```bash
# install the CLI: https://docs.turso.tech/cli/installation
turso db create claude-vs-codex
turso db shell claude-vs-codex < schema.sql      # create the tables

turso db show claude-vs-codex --url              # -> TURSO_DATABASE_URL
turso db tokens create claude-vs-codex           # -> TURSO_AUTH_TOKEN
```

### 2. Local development

```bash
npm install
cp .env.example .env        # paste the URL + token from step 1
npm i -g vercel             # one-time
vercel dev                  # runs the frontend AND the /api functions together
```

> `npm run dev` alone only serves the frontend — the `/api` functions need
> `vercel dev` (or a deploy) to run.

### 3. Deploy

Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new), or:

```bash
vercel
```

Then add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` under
**Project → Settings → Environment Variables** and redeploy.

## Abuse / integrity — read this

This is a **fun** poll, not a tamper-proof one. Voter identity is a per-browser
`localStorage` UUID (falling back to a hashed IP), so:

- Dedup is best-effort. Clearing storage or sending a different id lets someone
  vote again. The same is true for upvotes.
- It's enough to stop casual double-voting, **not** a determined ballot-stuffer.

If the result ever needs to be *credible*, add a real signal — Cloudflare
Turnstile / a captcha on the vote endpoint, rate limiting, or sign-in. That's a
deliberate, separate step; don't present these numbers as authoritative without it.
