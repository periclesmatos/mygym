import { nextLine, points, todayLine, warning } from '@/features/ranking/domain/rankText'
import { RankBadge } from '@/shared/ui/RankBadge'

/** Brasão, pontos, barra e o que falta para o próximo. */
export function RankSummary({ overview, size = 72 }) {
  const { rank } = overview
  const alert = warning(overview)
  return (
    <div className={`rank-summary rank-${rank.key}`}>
      <div className="rank-top">
        <RankBadge rank={rank} size={size} />
        <div className="rank-title">
          <span className="muted small">Seu rank · últimos 90 dias</span>
          <strong className="rank-name">{rank.label}</strong>
          <span className="rank-points tabular">{points(overview.points)}</span>
        </div>
      </div>
      <div className="rank-bar" aria-hidden="true">
        <span style={{ width: `${Math.min(1, overview.progress) * 100}%` }} />
      </div>
      <p className="rank-next">{nextLine(overview)}</p>
      <p className="muted small">{todayLine(overview)}</p>
      {alert && <p className={alert.urgent ? 'rank-alert small' : 'muted small'}>{alert.text}</p>}
    </div>
  )
}
