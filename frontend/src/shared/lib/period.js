import { dateKey, formatTime } from '@/shared/lib/date'

const MINUTE = 60000
const DAY = 24 * 60 * MINUTE

/** Dia e hora locais como Date, ou null se faltar algo. */
function localDate(day, time, addDays = 0) {
  if (!day || !time) return null
  const [year, month, date] = day.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  const value = new Date(year, month - 1, date + addDays, hours, minutes)
  return Number.isNaN(value.getTime()) ? null : value
}

function momentError(value, now) {
  if (value.getTime() > now + MINUTE) return 'O horário não pode ficar no futuro.'
  if (value.getFullYear() < 2000) return 'Data inválida.'
  return null
}

/** O campo só tem minutos: se ele não mudou, mantém o valor original, com os segundos. */
function keepSeconds(value, original) {
  if (!original) return value
  const before = new Date(original)
  return Math.floor(before.getTime() / MINUTE) === Math.floor(value.getTime() / MINUTE) ? before : value
}

/** Campos do formulário. Com 24 h ou mais o fim fica vazio, porque não cabe em dia + horários. */
export function periodForm({ startedAt, finishedAt }) {
  const fits = finishedAt && new Date(finishedAt) - new Date(startedAt) < DAY
  return { date: dateKey(startedAt), start: formatTime(startedAt), end: fits ? formatTime(finishedAt) : '' }
}

export function endsNextDay({ start, end }) {
  return Boolean(start && end && end < start)
}

/** Início de um treino passado: { startedAt } ou { error }. */
export function readStart({ date, start }, now = Date.now()) {
  const value = localDate(date, start)
  if (!value) return { error: 'Informe o dia e o horário de início.' }
  const error = momentError(value, now)
  return error ? { error } : { startedAt: value.toISOString() }
}

/** Formulário -> { startedAt, finishedAt } em ISO, ou { error }. Fim menor que o início é no dia seguinte. */
export function readPeriod(form, original = {}, now = Date.now()) {
  let start = localDate(form.date, form.start)
  let end = localDate(form.date, form.end, endsNextDay(form) ? 1 : 0)
  if (!start || !end) return { error: 'Informe o dia, o início e o fim.' }
  start = keepSeconds(start, original.startedAt)
  end = keepSeconds(end, original.finishedAt)
  const error = momentError(start, now) || momentError(end, now)
  if (error) return { error }
  if (end <= start) return { error: 'O fim precisa ser depois do início.' }
  return { startedAt: start.toISOString(), finishedAt: end.toISOString() }
}
