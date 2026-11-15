import { formatRest } from '@/shared/lib/date'
import { numberOrNull } from '@/shared/lib/number'
import { formatLoad } from '@/shared/lib/training'

let uid = 0
/** Chave local para listas; crypto.randomUUID só existe em HTTPS/localhost. */
export function localKey() {
  uid += 1
  return `k${Date.now().toString(36)}${uid}`
}

export function emptyExercise() {
  return {
    key: localKey(),
    name: '',
    plannedSets: '3',
    reps: '8-12',
    load: '',
    restSeconds: '90',
    rir: '',
    muscleGroup: ''
  }
}

export function exerciseFromTemplate(exercise) {
  return {
    key: localKey(),
    name: exercise.name,
    plannedSets: String(exercise.plannedSets),
    reps: exercise.reps,
    load: exercise.load == null ? '' : String(exercise.load),
    restSeconds: String(exercise.restSeconds),
    rir: exercise.rir == null ? '' : String(exercise.rir),
    muscleGroup: exercise.muscleGroup || ''
  }
}

export function exercisePayload(exercise) {
  return {
    name: exercise.name.trim(),
    plannedSets: Number(exercise.plannedSets),
    reps: String(exercise.reps).trim(),
    load: numberOrNull(exercise.load),
    restSeconds: Number(exercise.restSeconds),
    rir: numberOrNull(exercise.rir),
    muscleGroup: exercise.muscleGroup || null
  }
}

export function validateExercise(exercise) {
  if (!exercise.name.trim()) return 'Dê um nome ao exercício.'
  const sets = Number(exercise.plannedSets)
  if (!Number.isInteger(sets) || sets < 1 || sets > 20) return 'Use de 1 a 20 séries.'
  if (!String(exercise.reps).trim()) return 'Informe as repetições, como 8-12.'
  if (String(exercise.reps).trim().length > 20) return 'Repetições deve ser curto, como 8-12.'
  const load = numberOrNull(exercise.load)
  if (exercise.load !== '' && (load == null || load < 0 || load > 9999)) return 'Carga inválida.'
  const rest = Number(exercise.restSeconds)
  if (!Number.isInteger(rest) || rest < 0 || rest > 3600) return 'Descanso inválido.'
  const rir = numberOrNull(exercise.rir)
  if (exercise.rir !== '' && (rir == null || !Number.isInteger(rir) || rir < 0 || rir > 10))
    return 'RIR deve ficar entre 0 e 10.'
  return ''
}

export function exerciseSummary(exercise) {
  const load = formatLoad(numberOrNull(exercise.load))
  const parts = [`${exercise.plannedSets} × ${exercise.reps}`]
  if (load) parts.push(load)
  if (exercise.rir !== '' && exercise.rir != null) parts.push(`RIR ${exercise.rir}`)
  parts.push(formatRest(exercise.restSeconds))
  return parts.join(' · ')
}
