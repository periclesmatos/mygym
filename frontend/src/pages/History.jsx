import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { dateKey, formatVolume, formatWhen } from '../format'

export function History() {
  const [sessions, setSessions] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.sessions('finished').then((list) => { if (active) setSessions(list) }).catch((caught) => { if (active) setError(caught.message) })
    return () => { active = false }
  }, [])

  return (
    <div>
      <h1>Histórico</h1>
      {error && <p className="error">{error}</p>}
      {sessions === null && <p className="muted">Carregando…</p>}
      {sessions?.length === 0 && <p className="muted">Nenhum treino encerrado ainda.</p>}
      {sessions?.map((session, index) => (
        <div key={session.id}>
          {dateKey(session.finishedAt) !== dateKey(sessions[index - 1]?.finishedAt) && (
            <h2 className="history-day">{dayHeading(session.finishedAt)}</h2>
          )}
          <Link className="card link-card history-card" to={`/history/${session.id}`}>
          <span>
            <strong>{session.name}</strong>
            <span className="muted small">{formatWhen(session.finishedAt)} · {session.exerciseCount === 1 ? '1 exercício' : `${session.exerciseCount} exercícios`}</span>
          </span>
          <span className="history-meta">{session.completedSets}/{session.totalSets} séries{formatVolume(session.volume) ? ` · ${formatVolume(session.volume)}` : ''}</span>
          </Link>
        </div>
      ))}
    </div>
  )
}

function dayHeading(iso) {
  const raw = new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}
