import { INTENSITIES, targetMinutes } from '@/shared/lib/cardio'
import { Icon } from '@/shared/ui/Icon'

/** Um trecho de cardio: minutos, km opcional, intensidade e o check. */
export function CardioRow({ set, draft, target, onOptions, onChange, onToggle }) {
  const done = Boolean(set.completedAt)
  return (
    <div className={done ? 'cardio-row done' : 'cardio-row'}>
      <button type="button" className="set-num" onClick={onOptions} aria-label={`Opções do trecho ${set.position}`}>
        {set.position}
      </button>
      <label className="cardio-field">
        <span>Minutos</span>
        <input
          className="set-input"
          inputMode="decimal"
          enterKeyHint="next"
          placeholder={String(targetMinutes(target) || '—')}
          value={draft.minutes}
          onChange={(event) => onChange('minutes', event.target.value)}
          onFocus={(event) => event.target.select()}
        />
      </label>
      <label className="cardio-field">
        <span>km (opcional)</span>
        <input
          className="set-input"
          inputMode="decimal"
          enterKeyHint="done"
          placeholder="—"
          value={draft.km}
          onChange={(event) => onChange('km', event.target.value)}
          onFocus={(event) => event.target.select()}
        />
      </label>
      <button
        type="button"
        className={done ? 'set-check on' : 'set-check'}
        aria-pressed={done}
        aria-label={done ? `Desmarcar trecho ${set.position}` : `Marcar trecho ${set.position} como feito`}
        onClick={onToggle}
      >
        <Icon name="check" size={20} strokeWidth={3} />
      </button>
      <div className="intensity" role="radiogroup" aria-label="Intensidade">
        {INTENSITIES.map((item) => (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={draft.intensity === item.value}
            className={draft.intensity === item.value ? 'on' : ''}
            onClick={() => onChange('intensity', item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
