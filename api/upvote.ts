import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, getVoterHash } from './_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const reasonId = Number(req.body?.reasonId)
  if (!Number.isInteger(reasonId)) return res.status(400).json({ error: 'Invalid reasonId' })

  const voter = getVoterHash(req)
  // Toggle: if this voter already upvoted, remove it; otherwise add it.
  const existing = await db.execute({
    sql: `select 1 from reason_upvotes where reason_id = ? and voter_hash = ?`,
    args: [reasonId, voter],
  })

  let upvotedByMe: boolean
  if (existing.rows.length > 0) {
    await db.execute({
      sql: `delete from reason_upvotes where reason_id = ? and voter_hash = ?`,
      args: [reasonId, voter],
    })
    upvotedByMe = false
  } else {
    await db.execute({
      sql: `insert into reason_upvotes (reason_id, voter_hash) values (?, ?)
            on conflict (reason_id, voter_hash) do nothing`,
      args: [reasonId, voter],
    })
    upvotedByMe = true
  }

  const count = await db.execute({
    sql: `select count(*) as n from reason_upvotes where reason_id = ?`,
    args: [reasonId],
  })

  return res.status(200).json({ ok: true, upvotes: Number(count.rows[0]?.n ?? 0), upvotedByMe })
}
