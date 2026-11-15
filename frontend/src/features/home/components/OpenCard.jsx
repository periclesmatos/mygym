import { Link } from 'react-router-dom'
import { useNow } from '@/shared/hooks/useNow'
import { formatClock } from '@/shared/lib/date'
import { Icon } from '@/shared/ui/Icon'

/** Treino em andamento, com o relógio correndo. */
export function OpenCard({ session, onDiscard }) {
  const now = useNow(1000)
  const elapsed = (now - new Date(session.startedAt).getTime()) / 1000
  const ratio = session.totalSets ? session.completedSets / session.totalSets : 0
  return (
    <section className="card hero live">
      <div className="hero-top">
        <span className="badge live-badge">
          <span className="pulse" />
          Em andamento
        </span>
        <span className="hero-clock">{formatClock(elapsed)}</span>
      </div>
      <h2 className="hero-title">{session.name}</h2>
      <p className="muted">
        {session.completedSets} de {session.totalSets} séries feitas
      </p>
      <div className="progress" aria-hidden="true">
        <span style={{ width: `${ratio * 100}%` }} />
      </div>
      <Link className="btn btn-primary btn-lg btn-block" to={`/treino/${session.id}`}>
        <Icon name="play" size={18} filled />
        Continuar treino
      </Link>
      <button type="button" className="btn btn-quiet btn-block danger-text" onClick={onDiscard}>
        Descartar
      </button>
    </section>
  )
}
