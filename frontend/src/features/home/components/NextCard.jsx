import { Link } from 'react-router-dom'
import { dayLetter } from '@/features/routine'
import { formatDuration, relativeDay } from '@/shared/lib/date'
import { MuscleChips, muscleGroups, totalSets } from '@/features/catalog'
import { plural } from '@/shared/lib/text'
import { estimateMinutes } from '@/shared/lib/training'
import { Icon } from '@/shared/ui/Icon'

/** Próximo treino da rotina: grupos musculares e um resumo curto. */
export function NextCard({ next, lastDone, busy, onStart, onSwap }) {
  const { day, index, total, doneToday } = next
  const groups = muscleGroups(day.exercises)
  const sets = totalSets(day.exercises)
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
      <MuscleChips groups={groups} size="lg" />
      <div className="facts">
        <span>
          <Icon name="dumbbell" size={16} />
          {plural(day.exercises.length, 'exercício', 'exercícios')}
          {sets > 0 && ` · ${plural(sets, 'série', 'séries')}`}
        </span>
        <span>
          <Icon name="timer" size={16} />~{estimateMinutes(day.exercises)} min
        </span>
        <span>
          <Icon name="calendar" size={16} />
          {lastDone ? `Último: ${relativeDay(lastDone.finishedAt).toLowerCase()}` : 'Primeira vez'}
        </span>
      </div>
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
