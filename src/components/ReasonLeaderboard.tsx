import { upvoteReason, type Reason } from '../api'

type Props = {
  reasons: Reason[]
  onChanged: () => void
}

export function ReasonLeaderboard({ reasons, onChanged }: Props) {
  async function upvote(id: number) {
    await upvoteReason(id)
    onChanged()
  }

  return (
    <section className="leaderboard">
      <h2>Top reasons</h2>

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
