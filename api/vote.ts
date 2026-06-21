import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, getVoterHash, isChoice } from './_db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const choice = req.body?.choice
  if (!isChoice(choice)) return res.status(400).json({ error: 'Invalid choice' })

  const voter = getVoterHash(req)
  // One vote per voter — silently ignore repeat votes.
  await db.execute({
    sql: `insert into votes (choice, voter_hash) values (?, ?)
          on conflict (voter_hash) do nothing`,
    args: [choice, voter],
  })

  return res.status(200).json({ ok: true })
}
