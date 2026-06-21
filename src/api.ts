import { getVoterId } from './lib/voter'

export type Choice = 'claude' | 'codex'

export type Reason = {
  id: number
  choice: Choice
  body: string
  upvotes: number
  upvotedByMe: boolean
}

export type Results = {
  tally: { claude: number; codex: number }
  myVote: Choice | null
  reasons: Reason[]
}

const headers = () => ({
  'Content-Type': 'application/json',
  'x-voter-id': getVoterId(),
})

async function parse(res: Response) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export async function fetchResults(): Promise<Results> {
  return parse(await fetch('/api/results', { headers: headers() }))
}

export async function castVote(choice: Choice) {
  return parse(
    await fetch('/api/vote', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ choice }),
    }),
  )
}

export async function postReason(choice: Choice, body: string) {
  return parse(
    await fetch('/api/reason', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ choice, body }),
    }),
  )
}

export async function upvoteReason(reasonId: number) {
  return parse(
    await fetch('/api/upvote', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ reasonId }),
    }),
  )
}
