import { numberOrNull } from '../format'

function roundStep(value) {
  return Math.round(value * 100) / 100
}

export function Stepper({ label, value, seed, step, min = 0, max, onChange, inputMode = 'decimal' }) {
  function bump(direction) {
    const current = numberOrNull(value)
    const seeded = numberOrNull(seed)
    let next
    if (current == null) next = seeded != null ? seeded : (direction > 0 ? step : min)
    else next = current + direction * step
    const bounded = Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, roundStep(next)))
    onChange(String(bounded))
  }

  return (
    <div className="stepper">
      <span>{label}</span>
      <div className="stepper-row">
        <button type="button" onClick={() => bump(-1)} aria-label={`Diminuir ${label}`}>−</button>
        <input
          inputMode={inputMode}
          aria-label={label}
          value={value}
          placeholder={seed === '' || seed == null ? '—' : String(seed)}
          onChange={(event) => onChange(event.target.value)}
          onFocus={(event) => event.target.select()}
        />
        <button type="button" onClick={() => bump(1)} aria-label={`Aumentar ${label}`}>+</button>
      </div>
    </div>
  )
}
