import { Link } from 'react-router-dom'
import { dayLetter } from '@/features/routine/lib/schedule'
import { formatDuration } from '@/shared/lib/date'
import { plural } from '@/shared/lib/text'
import { estimateMinutes } from '@/shared/lib/training'
import { Icon } from '@/shared/ui/Icon'

/** Próximo treino da rotina, com prévia dos exercícios. */
export function NextCard({ next, busy, onStart, onSwap }) {
  const { day, index, total, doneToday } = next
  const preview = day.exercises.slice(0, 5)
  const hidden = day.exercises.length - preview.length
  return (
    <section className="card hero">
      {doneToday && (
        <Link to={`/historico/${doneToday.id}`} className="done-banner">
          <Icon name="check" size={18} strokeWidth={3} />
          <span>
            <strong>{doneToday.name}</strong> concluído hoje
            {doneToday.durationSeconds ? ` em ${formatDuration(doneToday.durationSeconds)}` : ''}
          </span>
          <Icon name="forward" size={16} />
        </Link>
      )}
      <div className="hero-top">
        <span className="badge">{doneToday ? 'Próximo treino' : 'Treino de hoje'}</span>
        <span className="muted small">
          Treino {dayLetter(index)} · {index + 1} de {total}
        </span>
      </div>
      <h2 className="hero-title">{day.name}</h2>
      <p className="muted">
        {plural(day.exercises.length, 'exercício', 'exercícios')} · cerca de {estimateMinutes(day.exercises)} min
      </p>
      <ul className="hero-list">
        {preview.map((exercise) => (
          <li key={exercise.id}>
            <span>{exercise.name}</span>
            <span className="muted">
              {exercise.plannedSets} × {exercise.reps}
            </span>
          </li>
        ))}
        {hidden > 0 && <li className="muted">+ {plural(hidden, 'exercício', 'exercícios')}</li>}
      </ul>
      <button
        type="button"
        className={doneToday ? 'btn btn-secondary btn-lg btn-block' : 'btn btn-primary btn-lg btn-block'}
        disabled={busy}
        onClick={onStart}
      >
        <Icon name="play" size={18} filled />
        {busy ? 'Começando…' : 'Começar treino'}
      </button>
      <button type="button" className="btn btn-quiet btn-block" onClick={onSwap}>
        Escolher outro treino
      </button>
    </section>
  )
}
