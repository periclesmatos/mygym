import { LIVE_LIMIT } from '@/shared/lib/activity'
import { parseCardio } from '@/shared/lib/cardio'
import { numberOrNull } from '@/shared/lib/number'
import { bestSet, estimatedMax, exerciseKey, formatSet } from '@/shared/lib/training'

/** Valores de uma série como texto, para os campos editáveis. */
export function draftFrom(set, cardio = false) {
  if (cardio) {
    return {
      minutes: set.durationSeconds ? String(Math.round(set.durationSeconds / 6) / 10) : '',
      km: set.distanceMeters == null ? '' : String(set.distanceMeters / 1000),
      intensity: set.intensity || 'moderate'
    }
  }
  return {
    reps: set.reps == null ? '' : String(set.reps),
    load: set.load == null ? '' : String(Number(set.load)),
    rir: set.rir == null ? '' : String(set.rir)
  }
}

/** Converte o rascunho de uma série para a API, ou devolve { error }. */
export function parseDraft(draft, cardio = false) {
  if (cardio) return parseCardio(draft)
  const reps = numberOrNull(draft.reps)
  const load = numberOrNull(draft.load)
  const rir = numberOrNull(draft.rir)
  if (reps != null && (!Number.isInteger(reps) || reps < 0 || reps > 999)) return { error: 'Repetições inválidas.' }
  if (load != null && (load < 0 || load > 9999.99)) return { error: 'Carga inválida.' }
  if (rir != null && (!Number.isInteger(rir) || rir < 0 || rir > 10)) return { error: 'RIR deve ficar entre 0 e 10.' }
  return { values: { reps, load, rir } }
}

/** A série pertence a um exercício de cardio? */
export function isCardioSet(session, setId) {
  return Boolean(session?.exercises.find((exercise) => exercise.sets.some((set) => set.id === setId))?.cardio)
}

export function findSet(session, setId) {
  for (const exercise of session?.exercises || []) {
    for (const set of exercise.sets) if (set.id === setId) return set
  }
  return null
}

/** Próxima série não feita depois de `afterSetId`, dando a volta no treino. */
export function nextOpenSet(session, afterSetId) {
  const items = []
  for (const exercise of session.exercises) for (const set of exercise.sets) items.push({ exercise, set })
  const start = items.findIndex((item) => item.set.id === afterSetId)
  const ordered = [...items.slice(start + 1), ...items.slice(0, Math.max(0, start))]
  return ordered.find((item) => !item.set.completedAt) || null
}

/**
 * Fim provável: a última série antes de uma pausa maior que 4 h, para ignorar o que foi marcado no dia
 * seguinte. Sem essa pista, ou no retroativo (séries marcadas depois), uma hora após o início.
 */
export function suggestedEnd(session, now) {
  const start = new Date(session.startedAt).getTime()
  let end = start
  if (!session.backdated) {
    const times = session.exercises
      .flatMap((exercise) => exercise.sets)
      .filter((set) => set.completedAt)
      .map((set) => new Date(set.completedAt).getTime())
      .sort((a, b) => a - b)
    for (const time of times) {
      if (time - end > LIVE_LIMIT) break
      end = Math.max(end, time)
    }
  }
  // Arredonda para cima: o campo só tem minutos e não pode cair antes da última série.
  end = end === start ? start + 3600000 : Math.ceil(end / 60000) * 60000
  return new Date(Math.min(end, now)).toISOString()
}

/** O que foi feito da última vez nesta mesma série (mesma posição), se houver. */
export function previousSet(last, exercise, set) {
  return last[exerciseKey(exercise.name)]?.sets.find((item) => item.position === set.position) || null
}

/** Exercícios em que você foi melhor que da última vez, para a tela de conclusão. */
export function highlights(session, last) {
  const result = []
  for (const exercise of session.exercises) {
    if (exercise.cardio) continue
    const best = bestSet(exercise)
    if (!best) continue
    const previous = last[exerciseKey(exercise.name)]
    if (!previous) continue
    const now = estimatedMax(best.load, best.reps)
    // Compara pelos valores brutos: o estimatedMax do servidor vem arredondado.
    const before = estimatedMax(previous.topLoad, previous.topReps)
    const improved =
      now > 0 && before > 0
        ? now > before + 0.05
        : !best.load && !Number(previous.topLoad) && best.reps > (previous.topReps || 0)
    if (improved) {
      result.push({
        name: exercise.name,
        now: formatSet(best.load, best.reps),
        before: formatSet(previous.topLoad, previous.topReps)
      })
    }
  }
  return result
}
