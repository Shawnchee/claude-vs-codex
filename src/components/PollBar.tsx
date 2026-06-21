import type { Choice, Results } from '../api'

type Props = {
  tally: Results['tally']
  myVote: Choice | null
  onVote: (choice: Choice) => void
}

export function PollBar({ tally, myVote, onVote }: Props) {
  const total = tally.claude + tally.codex
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100))
  const width = (n: number) => (total === 0 ? 50 : (n / total) * 100)
  const voted = myVote !== null

  return (
    <section className="poll">
      <div className="bar">
        <div className="bar-claude" style={{ width: `${width(tally.claude)}%` }} />
        <div className="bar-codex" style={{ width: `${width(tally.codex)}%` }} />
      </div>

      <div className="poll-options">
        <button
          className={`option claude ${myVote === 'claude' ? 'mine' : ''}`}
          onClick={() => onVote('claude')}
          disabled={voted}
        >
          <span className="name">Claude</span>
          <span className="count">
            {pct(tally.claude)}% · {tally.claude}
          </span>
        </button>
        <button
          className={`option codex ${myVote === 'codex' ? 'mine' : ''}`}
          onClick={() => onVote('codex')}
          disabled={voted}
        >
          <span className="name">Codex</span>
          <span className="count">
            {pct(tally.codex)}% · {tally.codex}
          </span>
        </button>
      </div>

      <p className="muted center">
        {voted ? `You voted ${myVote} · ` : 'Click to vote · '}
        {total} total {total === 1 ? 'vote' : 'votes'}
      </p>
    </section>
  )
}
