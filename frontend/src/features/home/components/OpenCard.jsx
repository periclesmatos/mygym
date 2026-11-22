import { Link } from 'react-router-dom'
import { useNow } from '@/shared/hooks/useNow'
import { isLive } from '@/shared/lib/activity'
import { formatClock, formatTime, relativeDay } from '@/shared/lib/date'
import { Icon } from '@/shared/ui/Icon'

/** Treino aberto: ao vivo com o relógio correndo, ou esquecido/retroativo com a data. */
export function OpenCard({ session, onDiscard }) {
  const now = useNow(1000)
  const elapsed = (now - new Date(session.startedAt).getTime()) / 1000
  const ratio = session.totalSets ? session.completedSets / session.totalSets : 0
  const live = isLive(session, now)
  const when = `${relativeDay(session.startedAt).toLowerCase()} às ${formatTime(session.startedAt)}`
  return (
    <section className={live ? 'card hero live' : 'card hero'}>
      <div className="hero-top">
        {live ? (
          <>
            <span className="badge live-badge">
              <span className="pulse" />
              Em andamento
            </span>
            <span className="hero-clock">{formatClock(elapsed)}</span>
          </>
        ) : (
          <span className="badge">{session.backdated ? 'Registro de treino passado' : 'Treino não encerrado'}</span>
        )}
      </div>
      <h2 className="hero-title">{session.name}</h2>
      {!live && (
        <p className="muted">
          {session.backdated ? 'Feito' : 'Iniciado'} {when}
        </p>
      )}
      <p className="muted">
        {session.completedSets} de {session.totalSets} séries feitas
      </p>
      <div className="progress" aria-hidden="true">
        <span style={{ width: `${ratio * 100}%` }} />
      </div>
      <Link className="btn btn-primary btn-lg btn-block" to={`/treino/${session.id}`}>
        <Icon name="play" size={18} filled />
        {live ? 'Continuar treino' : 'Abrir e concluir'}
      </Link>
      <button type="button" className="btn btn-quiet btn-block danger-text" onClick={onDiscard}>
        Descartar
      </button>
    </section>
  )
}
