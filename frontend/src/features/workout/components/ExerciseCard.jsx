import { CardioRow } from '@/features/workout/components/CardioRow'
import { SetRow } from '@/features/workout/components/SetRow'
import { draftFrom, previousSet } from '@/features/workout/domain/session'
import { formatRest, relativeDay } from '@/shared/lib/date'
import { exerciseKey, formatEntry, formatLoad } from '@/shared/lib/training'
import { Icon, IconButton } from '@/shared/ui/Icon'

function targetText(exercise) {
  if (exercise.cardio) return exercise.targetReps
  return [
    `${exercise.targetReps} reps`,
    formatLoad(exercise.targetLoad),
    exercise.targetRir != null ? `RIR ${exercise.targetRir}` : null,
    exercise.restSeconds > 0 ? `descanso ${formatRest(exercise.restSeconds)}` : null
  ]
    .filter(Boolean)
    .join(' · ')
}

/** Cartão de um exercício do treino, com a meta, a última vez e as séries. */
export function ExerciseCard({
  exercise,
  drafts,
  last,
  onMenu,
  onSetOptions,
  onCopyPrevious,
  onChange,
  onToggle,
  onAddSet
}) {
  const finished = exercise.sets.filter((set) => set.completedAt).length
  const complete = exercise.sets.length > 0 && finished === exercise.sets.length
  const previous = last[exerciseKey(exercise.name)]
  return (
    <section className={complete ? 'card exercise complete' : 'card exercise'}>
      <header className="exercise-head">
        <div>
          <h2>
            {complete && <Icon name="check" size={18} strokeWidth={3} className="ok-text" />}
            {exercise.name}
          </h2>
          <p className="muted small">Meta: {targetText(exercise)}</p>
        </div>
        <IconButton icon="more" label={`Opções de ${exercise.name}`} onClick={onMenu} />
      </header>
      {previous && (
        <p className="last-line">
          <Icon name="history" size={15} />
          <span>
            {relativeDay(previous.date)}: {previous.sets.map(formatEntry).join(' · ')}
          </span>
        </p>
      )}

      {exercise.cardio &&
        exercise.sets.map((set) => (
          <CardioRow
            key={set.id}
            set={set}
            draft={drafts[set.id] || draftFrom(set, true)}
            target={exercise.targetReps}
            onOptions={() => onSetOptions(set)}
            onChange={(field, value) => onChange(set.id, field, value)}
            onToggle={() => onToggle(set)}
          />
        ))}
      {!exercise.cardio && exercise.sets.length > 0 && (
        <div className="sets" role="table" aria-label={`Séries de ${exercise.name}`}>
          <div className="set-row head" role="row">
            <span role="columnheader">Série</span>
            <span role="columnheader">Anterior</span>
            <span role="columnheader">kg</span>
            <span role="columnheader">Reps</span>
            <span role="columnheader" className="sr-only">
              Feita
            </span>
          </div>
          {exercise.sets.map((set) => (
            <SetRow
              key={set.id}
              set={set}
              draft={drafts[set.id] || draftFrom(set)}
              prior={previousSet(last, exercise, set)}
              targetReps={exercise.targetReps}
              onOptions={() => onSetOptions(set)}
              onCopyPrevious={() => onCopyPrevious(set)}
              onChange={(field, value) => onChange(set.id, field, value)}
              onToggle={() => onToggle(set)}
            />
          ))}
        </div>
      )}

      <button type="button" className="btn btn-quiet btn-sm btn-block" onClick={onAddSet}>
        <Icon name="plus" size={18} />
        {exercise.cardio ? 'Adicionar trecho' : 'Adicionar série'}
      </button>
    </section>
  )
}
