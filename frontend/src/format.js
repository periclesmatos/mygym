export function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(String(value).trim().replace(',', '.'))
  return Number.isFinite(number) ? number : null
}

export function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

export function formatNumber(value, digits = 2) {
  const number = Number(value)
  if (!Number.isFinite(number)) return ''
  return number.toLocaleString('pt-BR', { maximumFractionDigits: digits })
}

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

export function dateKey(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function parseDateKey(key) {
  const [year, month, day] = (key || '').split('-').map(Number)
  const date = new Date(year, (month || 1) - 1, day || 1)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDay(value, options = { weekday: 'long', day: 'numeric', month: 'long' }) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return capitalize(date.toLocaleDateString('pt-BR', options))
}

export function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** "Hoje", "Ontem", "Há 3 dias" ou a data curta. */
export function relativeDay(value, now = new Date()) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const start = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((start(now) - start(date)) / 86400000)
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  if (days > 1 && days < 7) return `Há ${days} dias`
  const sameYear = date.getFullYear() === now.getFullYear()
  return formatDay(
    date,
    sameYear
      ? { weekday: 'short', day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'short', year: 'numeric' }
  )
}

export function formatDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  if (hours) return `${hours} h ${String(minutes).padStart(2, '0')}`
  if (minutes) return `${minutes} min`
  return `${total} s`
}

export function formatClock(totalSeconds) {
  const total = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const mm = hours ? String(minutes).padStart(2, '0') : String(minutes)
  return `${hours ? `${hours}:` : ''}${mm}:${String(seconds).padStart(2, '0')}`
}

export function formatRest(seconds) {
  const total = Number(seconds)
  if (!Number.isFinite(total) || total <= 0) return 'sem descanso'
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  // Espaços não separáveis: "1 min 30" não quebra no meio.
  if (minutes && rest) return `${minutes}\u00a0min\u00a0${String(rest).padStart(2, '0')}`
  if (minutes) return `${minutes}\u00a0min`
  return `${total}\u00a0s`
}

export function plural(count, one, many) {
  return `${count} ${count === 1 ? one : many}`
}

/** Primeiro número de "8-12", "10", "até a falha 12" etc. */
export function firstReps(target) {
  const match = String(target || '').match(/\d+/)
  return match ? match[0] : ''
}

let uid = 0
/** Chave local para listas; crypto.randomUUID só existe em HTTPS/localhost. */
export function localKey() {
  uid += 1
  return `k${Date.now().toString(36)}${uid}`
}

export function emptyExercise() {
  return { key: localKey(), name: '', plannedSets: '3', reps: '8-12', load: '', restSeconds: '90', rir: '' }
}

export function exerciseFromTemplate(exercise) {
  return {
    key: localKey(),
    name: exercise.name,
    plannedSets: String(exercise.plannedSets),
    reps: exercise.reps,
    load: exercise.load == null ? '' : String(exercise.load),
    restSeconds: String(exercise.restSeconds),
    rir: exercise.rir == null ? '' : String(exercise.rir)
  }
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
