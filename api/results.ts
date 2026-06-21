import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, getVoterHash } from './_db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const voter = getVoterHash(req)

  const votes = await db.execute(`select choice, count(*) as n from votes group by choice`)
  const tally = { claude: 0, codex: 0 }
  for (const row of votes.rows) {
    const c = String(row.choice)
    if (c === 'claude' || c === 'codex') tally[c] = Number(row.n)
  }

  // Reason leaderboard: upvotes counted live, plus whether this voter upvoted each.
  const reasons = await db.execute({
    sql: `select r.id, r.choice, r.body,
                 count(u.voter_hash)                                  as upvotes,
                 max(case when u.voter_hash = ? then 1 else 0 end)    as mine
          from reasons r
          left join reason_upvotes u on u.reason_id = r.id
          group by r.id
          order by upvotes desc, r.id desc
          limit 100`,
    args: [voter],
  })

  const mine = await db.execute({
    sql: `select choice from votes where voter_hash = ?`,
    args: [voter],
  })

  return res.status(200).json({
    tally,
    myVote: mine.rows[0]?.choice ?? null,
    reasons: reasons.rows.map((r) => ({
      id: Number(r.id),
      choice: String(r.choice),
      body: String(r.body),
      upvotes: Number(r.upvotes),
      upvotedByMe: Number(r.mine) === 1,
    })),
  })
}
