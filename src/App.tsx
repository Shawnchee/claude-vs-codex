import { useEffect, useState } from 'react'
import { castVote, fetchResults, type Choice, type Results } from './api'
import { PollBar } from './components/PollBar'
import { ReasonForm } from './components/ReasonForm'
import { ReasonLeaderboard } from './components/ReasonLeaderboard'

export default function App() {
  const [results, setResults] = useState<Results | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    try {
      setResults(await fetchResults())
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 5000) // keep the tallies feeling live
    return () => clearInterval(timer)
  }, [])

  async function onVote(choice: Choice) {
    await castVote(choice)
    refresh()
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-logos">
          <img src="/claude.png" alt="Claude" />
          <span className="vs">vs</span>
          <img src="/codex.png" alt="Codex" />
        </div>
        <h1>
          Claude <span className="vs">vs</span> Codex
        </h1>
        <p className="subtitle">
          Which coding agent do you trust? Vote and tell us why — anonymous.
        </p>
      </header>

      {error && <p className="error center">{error}</p>}

      {!results ? (
        <p className="muted center">Loading…</p>
      ) : (
        <>
          <PollBar tally={results.tally} myVote={results.myVote} onVote={onVote} />
          <ReasonForm defaultChoice={results.myVote ?? 'claude'} onPosted={refresh} />
          <ReasonLeaderboard reasons={results.reasons} onChanged={refresh} />
        </>
      )}

      <footer className="footer">Fun, anonymous poll · one vote per browser</footer>
    </div>
  )
}
