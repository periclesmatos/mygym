import { numberOrNull } from '../format'

function round(value) {
  return Math.round(value * 100) / 100
}

export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  seed,
  suffix,
  inputMode = 'decimal',
  placeholder,
  allowEmpty
}) {
  function bump(direction) {
    const current = numberOrNull(value)
    const seeded = numberOrNull(seed)
    let next
    if (current != null) next = current + direction * step
    else if (seeded != null) next = seeded
    else next = direction > 0 ? step : min
    next = Math.min(max ?? Infinity, Math.max(min, round(next)))
    onChange(String(next))
  }
  const current = numberOrNull(value)
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <div className="stepper">
        <button
          type="button"
          onClick={() => bump(-1)}
          aria-label={`Diminuir ${label || ''}`}
          disabled={!allowEmpty && current != null && current <= min}
        >
          −
        </button>
        <div className="stepper-value">
          <input
            inputMode={inputMode}
            aria-label={label}
            value={value}
            placeholder={placeholder ?? (seed != null && seed !== '' ? String(seed) : '—')}
            onChange={(event) => onChange(event.target.value)}
            onFocus={(event) => event.target.select()}
          />
          {suffix && <span>{suffix}</span>}
        </div>
        <button
          type="button"
          onClick={() => bump(1)}
          aria-label={`Aumentar ${label || ''}`}
          disabled={max != null && current != null && current >= max}
        >
          +
        </button>
      </div>
    </div>
  )
}

export function Chips({ options, value, onChange, label }) {
  return (
    <div className="chips" role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const active = String(option.value) === String(value)
        return (
          <button
            type="button"
            role="radio"
            aria-checked={active}
            key={option.value}
            className={active ? 'chip on' : 'chip'}
            onClick={() => onChange(String(option.value))}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          className={option.value === value ? 'on' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  )
}
