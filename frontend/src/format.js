export function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(String(value).trim().replace(',', '.'))
  return Number.isFinite(number) ? number : null
}

export function formatLoad(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  return `${number.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`
}

export function dateKey(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function formatVolume(value) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return null
  return `${number.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg`
}

export function formatWhen(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('pt-BR', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  })
}

export function formatRest(seconds) {
  const total = Number(seconds)
  if (!Number.isFinite(total) || total <= 0) return 'sem descanso'
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  if (minutes && rest) return `${minutes} min ${rest} s`
  if (minutes === 1) return '1 min'
  if (minutes) return `${minutes} min`
  return `${total} s`
}

export function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function emptyExercise() {
  return { key: crypto.randomUUID(), name: '', plannedSets: 3, reps: '8-12', load: '', restSeconds: 90, rir: '' }
}

export function exercisePayload(exercise) {
  return {
    name: exercise.name.trim(),
    plannedSets: Number(exercise.plannedSets),
    reps: String(exercise.reps).trim(),
    load: numberOrNull(exercise.load),
    restSeconds: Number(exercise.restSeconds),
    rir: numberOrNull(exercise.rir)
  }
}

export function validateExercises(exercises) {
  if (exercises.length === 0) return 'Adicione pelo menos um exercício.'
  for (const exercise of exercises) {
    if (!exercise.name.trim()) return 'Informe o nome do exercício.'
    if (!String(exercise.reps).trim()) return 'Informe as repetições.'
    const sets = Number(exercise.plannedSets)
    if (!Number.isInteger(sets) || sets < 1 || sets > 20) return 'Informe entre 1 e 20 séries.'
    const rest = Number(exercise.restSeconds)
    if (!Number.isInteger(rest) || rest < 0) return 'Informe o descanso em segundos.'
  }
  return ''
}
