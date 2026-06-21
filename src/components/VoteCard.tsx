import { useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import { submitVote, type Choice, type Results } from '../api'

type Props = {
  tally: Results['tally']
  myVote: Choice | null
  onSubmitted: Dispatch<SetStateAction<Results | null>>
}

const MAX = 280
const SIDES: { key: Choice; label: string }[] = [
  { key: 'claude', label: 'Claude' },
  { key: 'codex', label: 'Codex' },
]

// Optimistically move the tally for an instant UI response.
function applyVote(tally: Results['tally'], from: Choice | null, to: Choice): Results['tally'] {
  if (from === to) return tally
  const next = { ...tally }
  if (from) next[from] = Math.max(0, next[from] - 1)
  next[to] = next[to] + 1
  return next
}

export function VoteCard({ tally, myVote, onSubmitted }: Props) {
  // Local selection — initialised from the server's record of your vote, then
  // freely changeable. Polls refreshing `myVote` won't stomp your pending pick.
  const [selected, setSelected] = useState<Choice | null>(myVote)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const total = tally.claude + tally.codex
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100))
  const width = (n: number) => (total === 0 ? 50 : (n / total) * 100)

  const hasReason = reason.trim().length > 0
  const voteChanged = selected !== null && selected !== myVote
  const canSubmit = !busy && selected !== null && (voteChanged || hasReason)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!selected || busy) return
    setBusy(true)
    setErr(null)
    const snapTally = tally
    const snapMyVote = myVote
    // Optimistic: reflect the vote instantly, then reconcile with the server.
    onSubmitted((prev) =>
      prev ? { ...prev, tally: applyVote(prev.tally, prev.myVote, selected), myVote: selected } : prev,
    )
    try {
      // One request: casts/changes the vote, (re)posts the reason, returns state.
      const fresh = await submitVote(selected, hasReason ? reason.trim() : undefined)
      if (hasReason) setReason('')
      onSubmitted(fresh)
    } catch (e) {
      setErr((e as Error).message)
      onSubmitted((prev) => (prev ? { ...prev, tally: snapTally, myVote: snapMyVote } : prev))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="poll" onSubmit={submit}>
      <div className="bar">
        <div className="bar-claude" style={{ width: `${width(tally.claude)}%` }} />
        <div className="bar-codex" style={{ width: `${width(tally.codex)}%` }} />
      </div>

      <div className="poll-options">
        {SIDES.map(({ key, label }) => (
          <button
            type="button"
            key={key}
            className={`option ${key} ${selected === key ? 'selected' : ''}`}
            onClick={() => setSelected(key)}
          >
            <img className="logo" src={`/${key}.png`} alt="" />
            <span className="name">{label}</span>
            <span className="count">
              {pct(tally[key])}% · {tally[key]}
            </span>
          </button>
        ))}
      </div>

      <p className="muted center vote-status">
        {myVote
          ? `You voted ${myVote} · change anytime · ${total} ${total === 1 ? 'vote' : 'votes'}`
          : `Pick a side · ${total} ${total === 1 ? 'vote' : 'votes'}`}
      </p>

      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, MAX))}
        placeholder={selected ? `Why ${selected}? (optional)` : 'Pick a side, then add why (optional)…'}
        rows={3}
      />

      <div className="form-row">
        <span className="muted">
          {reason.length}/{MAX}
        </span>
        <button type="submit" disabled={!canSubmit}>
          {busy ? 'Submitting…' : 'Submit'}
        </button>
      </div>

      {err && <p className="error">{err}</p>}
    </form>
  )
}
