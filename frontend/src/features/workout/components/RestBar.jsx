import { formatClock } from '@/shared/lib/date'
import { Icon } from '@/shared/ui/Icon'

export function RestBar({ remaining, total, label, onAdjust, onSkip }) {
  const ratio = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0
  return (
    <div className="restbar" role="timer" aria-live="off" aria-label={`Descanso: ${formatClock(remaining)}`}>
      <div className="restbar-progress" style={{ transform: `scaleX(${ratio})` }} aria-hidden="true" />
      <div className="restbar-main">
        <div className="restbar-time">
          <span className="restbar-kicker">
            <Icon name="timer" size={16} /> Descanso
          </span>
          <strong>{formatClock(remaining)}</strong>
          {label && <span className="restbar-next">{label}</span>}
        </div>
        <div className="restbar-actions">
          <button type="button" onClick={() => onAdjust(-15)} aria-label="Menos 15 segundos">
            −15
          </button>
          <button type="button" onClick={() => onAdjust(15)} aria-label="Mais 15 segundos">
            +15
          </button>
          <button type="button" className="skip" onClick={onSkip}>
            <Icon name="skip" size={16} /> Pular
          </button>
        </div>
      </div>
    </div>
  )
}
