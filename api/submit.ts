import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { InStatement } from '@libsql/client'
import { db, getVoterHash, isChoice, stateReads, buildState } from './_db.js'

const MAX = 280

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const choice = req.body?.choice
  const body = String(req.body?.body ?? '').trim()
  if (!isChoice(choice)) return res.status(400).json({ error: 'Invalid choice' })
  if (body.length > MAX) return res.status(400).json({ error: `Max ${MAX} characters` })

  const voter = getVoterHash(req)

  // Upsert the vote (changeable). If a reason was typed, upsert it too — one
  // reason per browser, so re-submitting replaces your previous reason in place.
  const writes: InStatement[] = [
    {
      sql: `insert into votes (choice, voter_hash) values (?, ?)
            on conflict (voter_hash) do update set choice = excluded.choice`,
      args: [choice, voter],
    },
  ]
  if (body) {
    writes.push({
      sql: `insert into reasons (choice, body, author_hash) values (?, ?, ?)
            on conflict (author_hash) do update
              set choice = excluded.choice, body = excluded.body, created_at = datetime('now')`,
      args: [choice, body, voter],
    })
  }

  // Writes + the three reads in a single transactional batch = one round trip.
  const results = await db.batch([...writes, ...stateReads(voter)], 'write')
  const [tally, reasons, mine] = results.slice(writes.length)
  return res.status(200).json(buildState(tally, reasons, mine))
}
