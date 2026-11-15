import { capitalize } from '@/shared/lib/text'

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
