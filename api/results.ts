import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getVoterHash, readState } from './_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const voter = getVoterHash(req)
  return res.status(200).json(await readState(voter))
}
