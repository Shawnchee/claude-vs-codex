import type { Dispatch, SetStateAction } from 'react'
import { upvoteReason, type Reason, type Results } from '../api'

type Props = {
  reasons: Reason[]
  onChanged: Dispatch<SetStateAction<Results | null>>
  onRefresh: () => void
  refreshing: boolean
}

// Flip one reason's upvote state — used for the instant optimistic update.
function toggleUpvote(reasons: Reason[], id: number): Reason[] {
  return reasons.map((r) =>
    r.id === id
      ? { ...r, upvotedByMe: !r.upvotedByMe, upvotes: r.upvotes + (r.upvotedByMe ? -1 : 1) }
      : r,
  )
}

export function ReasonLeaderboard({ reasons, onChanged, onRefresh, refreshing }: Props) {
  async function upvote(id: number) {
    onChanged((prev) => (prev ? { ...prev, reasons: toggleUpvote(prev.reasons, id) } : prev))
    try {
      onChanged(await upvoteReason(id))
    } catch {
      onChanged((prev) => (prev ? { ...prev, reasons: toggleUpvote(prev.reasons, id) } : prev))
    }
  }

  return (
    <section className="leaderboard">
      <div className="leaderboard-head">
        <h2>Top reasons</h2>
        <button className="refresh-btn" onClick={onRefresh} disabled={refreshing} title="Refresh the poll">
          {refreshing ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {reasons.length === 0 ? (
        <p className="muted">No reasons yet. Be the first.</p>
      ) : (
        <ul>
          {reasons.map((r) => (
            <li key={r.id} className="reason">
              <button
                className={`upvote ${r.upvotedByMe ? 'active' : ''}`}
                onClick={() => upvote(r.id)}
                title={r.upvotedByMe ? 'Click to remove your upvote' : 'Upvote'}
              >
                <span className="caret">▲</span>
                <span>{r.upvotes}</span>
              </button>
              <div className="reason-body">
                <span className={`badge ${r.choice}`}>
                  <img className="badge-logo" src={`/${r.choice}.png`} alt="" />
                  {r.choice}
                </span>
                <p>{r.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
