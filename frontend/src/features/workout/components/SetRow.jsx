import { formatNumber } from '@/shared/lib/number'
import { firstReps, formatSet } from '@/shared/lib/training'
import { Icon } from '@/shared/ui/Icon'

/** Uma série: número (abre opções), última vez (toque copia), carga, reps e o check. */
export function SetRow({ set, draft, prior, targetReps, onOptions, onCopyPrevious, onChange, onToggle }) {
  const isDone = Boolean(set.completedAt)
  return (
    <div className={isDone ? 'set-row done' : 'set-row'} role="row">
      <button type="button" className="set-num" onClick={onOptions} aria-label={`Opções da série ${set.position}`}>
        {set.position}
      </button>
      <button
        type="button"
        className="set-prev"
        disabled={!prior || isDone}
        onClick={onCopyPrevious}
        aria-label={prior ? `Repetir ${formatSet(prior.load, prior.reps)}` : 'Sem registro anterior'}
      >
        {prior ? formatSet(prior.load, prior.reps) : '—'}
      </button>
      <input
        className="set-input"
        inputMode="decimal"
        enterKeyHint="next"
        aria-label={`Carga da série ${set.position}, em kg`}
        placeholder={prior?.load != null ? formatNumber(prior.load) : '—'}
        value={draft.load}
        onChange={(event) => onChange('load', event.target.value)}
        onFocus={(event) => event.target.select()}
      />
      <input
        className="set-input"
        inputMode="numeric"
        enterKeyHint="done"
        aria-label={`Repetições da série ${set.position}`}
        placeholder={prior?.reps != null ? String(prior.reps) : firstReps(targetReps) || '—'}
        value={draft.reps}
        onChange={(event) => onChange('reps', event.target.value)}
        onFocus={(event) => event.target.select()}
      />
      <button
        type="button"
        className={isDone ? 'set-check on' : 'set-check'}
        aria-pressed={isDone}
        aria-label={isDone ? `Desmarcar série ${set.position}` : `Marcar série ${set.position} como feita`}
        onClick={onToggle}
      >
        <Icon name="check" size={20} strokeWidth={3} />
      </button>
    </div>
  )
}
