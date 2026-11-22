import { Link } from 'react-router-dom'
import { formatCardio } from '@/shared/lib/cardio'
import { formatDuration, relativeDay } from '@/shared/lib/date'
import { plural } from '@/shared/lib/text'
import { formatVolume } from '@/shared/lib/training'
import { Icon } from '@/shared/ui/Icon'

/** Linha de um treino concluído nas listas do histórico. */
export function SessionItem({ session }) {
  const volume = formatVolume(session.volume) || (session.cardioSeconds ? formatCardio(session.cardioSeconds) : null)
  return (
    <Link to={`/historico/${session.id}`} className="list-item">
      <span className="list-main">
        <strong>{session.name}</strong>
        <span className="muted small">
          {relativeDay(session.finishedAt)}
          {session.durationSeconds ? ` · ${formatDuration(session.durationSeconds)}` : ''}
        </span>
      </span>
      <span className="list-meta">
        <strong>{plural(session.completedSets, 'série', 'séries')}</strong>
        {volume && <span className="muted small">{volume}</span>}
      </span>
      <Icon name="forward" size={18} className="muted" />
    </Link>
  )
}
