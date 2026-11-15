import { formatNumber } from '@/shared/lib/number'

export function formatLoad(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  return `${formatNumber(number)} kg`
}

export function formatVolume(value) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return null
  if (number >= 10000) return `${formatNumber(number / 1000, 1)} t`
  return `${formatNumber(number, 0)} kg`
}

/** "40 × 10", ou "10 reps" quando não há carga. */
export function formatSet(load, reps) {
  const hasLoad = load !== null && load !== undefined && load !== '' && Number(load) > 0
  if (reps === null || reps === undefined || reps === '') return hasLoad ? `${formatNumber(load)} kg` : '—'
  return hasLoad ? `${formatNumber(load)} × ${reps}` : `${reps} reps`
}

/** Primeiro número de "8-12", "10", "até a falha 12" etc. */
export function firstReps(target) {
  const match = String(target || '').match(/\d+/)
  return match ? match[0] : ''
}

/** Estimativa simples: cada série leva ~45 s mais o descanso. */
export function estimateMinutes(exercises) {
  let seconds = 0
  for (const exercise of exercises || []) {
    const sets = Number(exercise.plannedSets) || 0
    seconds += sets * 45 + Math.max(0, sets - 1) * (Number(exercise.restSeconds) || 0) + 60
  }
  return Math.max(5, Math.round(seconds / 300) * 5)
}

/** Totais de uma sessão completa (com séries). */
export function sessionTotals(session) {
  let done = 0
  let total = 0
  let volume = 0
  for (const exercise of session?.exercises || []) {
    for (const set of exercise.sets) {
      total += 1
      if (!set.completedAt) continue
      done += 1
      if (set.reps != null && set.load != null) volume += Number(set.load) * set.reps
    }
  }
  const duration = session?.finishedAt ? (new Date(session.finishedAt) - new Date(session.startedAt)) / 1000 : null
  return { done, total, volume, duration }
}

/** Melhor série feita de um exercício da sessão (maior carga; empate, mais reps). */
export function bestSet(exercise) {
  let best = null
  for (const set of exercise.sets) {
    if (!set.completedAt || !set.reps) continue
    const load = Number(set.load) || 0
    if (!best || load > best.load || (load === best.load && set.reps > best.reps)) best = { load, reps: set.reps }
  }
  return best
}

export function estimatedMax(load, reps) {
  const value = Number(load)
  if (!value || !reps) return 0
  return value * (1 + reps / 30)
}

/** Chave para comparar nomes de exercício (igual à usada pela API em /exercises/last). */
export function exerciseKey(name) {
  return (name || '').trim().toLowerCase()
}
