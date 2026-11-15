import { numberOrNull } from '@/shared/lib/number'
import { bestSet, estimatedMax, exerciseKey, formatSet } from '@/shared/lib/training'

/** Valores de uma série como texto, para os campos editáveis. */
export function draftFrom(set) {
  return {
    reps: set.reps == null ? '' : String(set.reps),
    load: set.load == null ? '' : String(Number(set.load)),
    rir: set.rir == null ? '' : String(set.rir)
  }
}

/** Converte o rascunho de uma série para a API, ou devolve { error }. */
export function parseDraft(draft) {
  const reps = numberOrNull(draft.reps)
  const load = numberOrNull(draft.load)
  const rir = numberOrNull(draft.rir)
  if (reps != null && (!Number.isInteger(reps) || reps < 0 || reps > 999)) return { error: 'Repetições inválidas.' }
  if (load != null && (load < 0 || load > 9999.99)) return { error: 'Carga inválida.' }
  if (rir != null && (!Number.isInteger(rir) || rir < 0 || rir > 10)) return { error: 'RIR deve ficar entre 0 e 10.' }
  return { values: { reps, load, rir } }
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

/** O que foi feito da última vez nesta mesma série (mesma posição), se houver. */
export function previousSet(last, exercise, set) {
  return last[exerciseKey(exercise.name)]?.sets.find((item) => item.position === set.position) || null
}

/** Exercícios em que você foi melhor que da última vez, para a tela de conclusão. */
export function highlights(session, last) {
  const result = []
  for (const exercise of session.exercises) {
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
