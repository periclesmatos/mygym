import { formatClock } from '../format'

export function RestTimer({ seconds, total, nextLabel, onAdjust, onSkip }) {
  const safeTotal = Math.max(total || seconds || 1, 1)
  const ratio = Math.max(0, Math.min(1, seconds / safeTotal))
  const radius = 20
  const length = 2 * Math.PI * radius
  return (
    <div className="rest-dock" role="status">
      <div className="rest-clock">
        <svg viewBox="0 0 52 52" aria-hidden="true">
          <circle cx="26" cy="26" r={radius} />
          <circle className="arc" cx="26" cy="26" r={radius} style={{ strokeDasharray: length, strokeDashoffset: length * (1 - ratio) }} />
        </svg>
        <div>
          <strong>{formatClock(Math.max(0, seconds))}</strong>
          <p>{nextLabel ? `Depois · ${nextLabel}` : 'Descanso'}</p>
        </div>
      </div>
      <div className="rest-actions">
        <button type="button" onClick={() => onAdjust(-15)}>−15</button>
        <button type="button" onClick={() => onAdjust(15)}>+15</button>
        <button type="button" onClick={onSkip}>Pular</button>
      </div>
    </div>
  )
}
