import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, getVoterHash } from './_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const reasonId = Number(req.body?.reasonId)
  if (!Number.isInteger(reasonId)) return res.status(400).json({ error: 'Invalid reasonId' })

  const voter = getVoterHash(req)
  // One upvote per voter per reason — repeat upvotes are ignored.
  await db.execute({
    sql: `insert into reason_upvotes (reason_id, voter_hash) values (?, ?)
          on conflict (reason_id, voter_hash) do nothing`,
    args: [reasonId, voter],
  })

  const count = await db.execute({
    sql: `select count(*) as n from reason_upvotes where reason_id = ?`,
    args: [reasonId],
  })

  return res.status(200).json({ ok: true, upvotes: Number(count.rows[0]?.n ?? 0) })
}
