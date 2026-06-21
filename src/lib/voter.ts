const KEY = 'voter-id'

// A stable per-browser id so the same person isn't double-counted and we can
// show which reasons they've already upvoted. Clearing storage resets it —
// fine for a fun, low-stakes poll.
export function getVoterId(): string {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}
