import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, getVoterHash, isChoice } from './_db'

const MAX_LEN = 280

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const choice = req.body?.choice
  const body = String(req.body?.body ?? '').trim()

  if (!isChoice(choice)) return res.status(400).json({ error: 'Invalid choice' })
  if (!body) return res.status(400).json({ error: 'Reason cannot be empty' })
  if (body.length > MAX_LEN) return res.status(400).json({ error: `Max ${MAX_LEN} characters` })

  const voter = getVoterHash(req)
  const result = await db.execute({
    sql: `insert into reasons (choice, body, author_hash) values (?, ?, ?)`,
    args: [choice, body, voter],
  })

  return res.status(200).json({ ok: true, id: Number(result.lastInsertRowid) })
}
