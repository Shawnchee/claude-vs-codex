import type { VercelRequest } from '@vercel/node'
import { createHash } from 'node:crypto'
import { createClient, type InStatement, type ResultSet } from '@libsql/client'

// Files prefixed with "_" are helpers, not public routes.
export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

export type Choice = 'claude' | 'codex'
export const CHOICES: Choice[] = ['claude', 'codex']

export function isChoice(value: unknown): value is Choice {
  return value === 'claude' || value === 'codex'
}

// A best-effort, anonymous voter id. Prefers the per-browser id the client
// sends (localStorage UUID); falls back to a hashed IP. Good enough for a fun
// poll — not tamper-proof. We hash so we never store anything identifying.
export function getVoterHash(req: VercelRequest): string {
  const fromClient = (req.headers['x-voter-id'] as string | undefined)?.trim()
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
  const basis = fromClient || ip || 'anon'
  return createHash('sha256').update(basis).digest('hex').slice(0, 32)
}

// --- Shared poll state (one batched round trip) ---

const Q_TALLY = `select choice, count(*) as n from votes group by choice`
const Q_REASONS = `select r.id, r.choice, r.body,
       count(u.voter_hash)                               as upvotes,
       max(case when u.voter_hash = ? then 1 else 0 end) as mine
  from reasons r
  left join reason_upvotes u on u.reason_id = r.id
  group by r.id
  order by upvotes desc, r.id desc
  limit 100`
const Q_MINE = `select choice from votes where voter_hash = ?`

// The three reads the UI needs — pass to db.batch() so they run as one trip.
export function stateReads(voter: string): InStatement[] {
  return [Q_TALLY, { sql: Q_REASONS, args: [voter] }, { sql: Q_MINE, args: [voter] }]
}

export function buildState(tallyRS: ResultSet, reasonsRS: ResultSet, mineRS: ResultSet) {
  const tally = { claude: 0, codex: 0 }
  for (const row of tallyRS.rows) {
    const c = String(row.choice)
    if (c === 'claude' || c === 'codex') tally[c] = Number(row.n)
  }
  return {
    tally,
    myVote: (mineRS.rows[0]?.choice as string | undefined) ?? null,
    reasons: reasonsRS.rows.map((r) => ({
      id: Number(r.id),
      choice: String(r.choice),
      body: String(r.body),
      upvotes: Number(r.upvotes),
      upvotedByMe: Number(r.mine) === 1,
    })),
  }
}

export async function readState(voter: string) {
  const [tally, reasons, mine] = await db.batch(stateReads(voter), 'read')
  return buildState(tally, reasons, mine)
}
