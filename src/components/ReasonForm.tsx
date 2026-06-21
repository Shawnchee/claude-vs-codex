import { useState, type FormEvent } from 'react'
import { postReason, type Choice } from '../api'

type Props = {
  defaultChoice: Choice
  onPosted: () => void
}

const MAX = 280

export function ReasonForm({ defaultChoice, onPosted }: Props) {
  const [choice, setChoice] = useState<Choice>(defaultChoice)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setBusy(true)
    setErr(null)
    try {
      await postReason(choice, body.trim())
      setBody('')
      onPosted()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="reason-form" onSubmit={submit}>
      <h2>
        Why? <span className="muted">(optional)</span>
      </h2>

      <div className="side-toggle">
        <button
          type="button"
          className={choice === 'claude' ? 'active claude' : ''}
          onClick={() => setChoice('claude')}
        >
          <img className="toggle-logo" src="/claude.png" alt="" />
          Claude
        </button>
        <button
          type="button"
          className={choice === 'codex' ? 'active codex' : ''}
          onClick={() => setChoice('codex')}
        >
          <img className="toggle-logo" src="/codex.png" alt="" />
          Codex
        </button>
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, MAX))}
        placeholder={`Why ${choice}? Keep it short…`}
        rows={3}
      />

      <div className="form-row">
        <span className="muted">
          {body.length}/{MAX}
        </span>
        <button type="submit" disabled={busy || !body.trim()}>
          {busy ? 'Posting…' : 'Post reason'}
        </button>
      </div>

      {err && <p className="error">{err}</p>}
    </form>
  )
}
