import type { VercelRequest } from '@vercel/node'
import { createHash } from 'node:crypto'
import { createClient } from '@libsql/client'

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
