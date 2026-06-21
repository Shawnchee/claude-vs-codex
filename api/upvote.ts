import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, getVoterHash, readState } from './_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const reasonId = Number(req.body?.reasonId)
  if (!Number.isInteger(reasonId)) return res.status(400).json({ error: 'Invalid reasonId' })

  const voter = getVoterHash(req)
  // Toggle: remove the upvote if present, otherwise add it.
  const existing = await db.execute({
    sql: `select 1 from reason_upvotes where reason_id = ? and voter_hash = ?`,
    args: [reasonId, voter],
  })
  if (existing.rows.length > 0) {
    await db.execute({
      sql: `delete from reason_upvotes where reason_id = ? and voter_hash = ?`,
      args: [reasonId, voter],
    })
  } else {
    await db.execute({
      sql: `insert into reason_upvotes (reason_id, voter_hash) values (?, ?)
            on conflict (reason_id, voter_hash) do nothing`,
      args: [reasonId, voter],
    })
  }

  return res.status(200).json(await readState(voter))
}
