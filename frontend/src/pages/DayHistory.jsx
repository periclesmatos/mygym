import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { dateKey, formatVolume, formatWhen } from '../format'

export function DayHistory() {
  const { date } = useParams()
  const [sessions, setSessions] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.sessions('finished')
      .then((list) => { if (active) setSessions(list.filter((session) => dateKey(session.finishedAt || session.startedAt) === date)) })
      .catch((caught) => { if (active) setError(caught.message) })
    return () => { active = false }
  }, [date])

  const [year, month, day] = (date || '').split('-').map(Number)
  const parsed = new Date(year, (month || 1) - 1, day || 1)
  const raw = Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const title = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Dia'

  return (
    <div>
      <p className="page-kicker">O que você fez</p>
      <h1>{title}</h1>
      {error && <p className="error">{error}</p>}
      {sessions === null && !error && <p className="muted">Carregando…</p>}
      {sessions?.length === 0 && <p className="muted">Nenhum treino neste dia.</p>}
      {sessions?.map((session) => (
        <Link className="card link-card history-card" key={session.id} to={`/history/${session.id}`}>
          <span>
            <strong>{session.name}</strong>
            <span className="muted small">{formatWhen(session.finishedAt)} · {session.exerciseCount === 1 ? '1 exercício' : `${session.exerciseCount} exercícios`}</span>
          </span>
          <span className="history-meta">{session.completedSets}/{session.totalSets}{formatVolume(session.volume) ? ` · ${formatVolume(session.volume)}` : ''}</span>
        </Link>
      ))}
    </div>
  )
}
