import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { fetchResults, type Results } from './api'
import { VoteCard } from './components/VoteCard'
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
          <VoteCard tally={results.tally} myVote={results.myVote} onSubmitted={setResults} />
          <ReasonLeaderboard reasons={results.reasons} onChanged={setResults} />
        </>
      )}

      <footer className="footer">Fun, anonymous poll · one vote per browser</footer>
      <Analytics />
    </div>
  )
}
