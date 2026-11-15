import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { formatLoad, formatWhen } from '../format'

export function HistoryDetail() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.session(id).then((data) => { if (active) setSession(data) }).catch((caught) => { if (active) setError(caught.message) })
    return () => { active = false }
  }, [id])

  if (error) return <p className="error">{error}</p>
  if (!session) return <p className="muted">Carregando…</p>

  return (
    <div>
      <h1>{session.name}</h1>
      <p className="muted">
        {formatWhen(session.startedAt)}
        {session.finishedAt ? ` – ${formatWhen(session.finishedAt)}` : ' · ainda aberto'}
      </p>
      {!session.finishedAt && <Link className="primary wide cta" to={`/workout/${session.id}`}>Continuar treino</Link>}
      {session.exercises.map((exercise) => (
        <section className="card" key={exercise.id}>
          <h2>{exercise.name}</h2>
          <p className="muted">
            Alvo {exercise.targetReps}
            {formatLoad(exercise.targetLoad) ? ` · ${formatLoad(exercise.targetLoad)}` : ''}
            {exercise.targetRir != null ? ` · RIR ${exercise.targetRir}` : ''}
            {` · ${exercise.restSeconds}s de descanso`}
          </p>
          {exercise.sets.map((set) => (
            <div key={set.id} className={set.completedAt ? 'set-line done' : 'set-line'}>
              <span className="set-index">{set.position}</span>
              <span>{set.reps ?? '—'} reps</span>
              <span>{formatLoad(set.load) || '—'}</span>
              <span>RIR {set.rir ?? '—'}</span>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
