import { dateKey } from '@/shared/lib/date'

export function orderedDays(templates) {
  return [...templates].sort((a, b) => a.position - b.position || a.id - b.id)
}

/** Qual dia da rotina é o da vez, a partir do último treino concluído da rotina. */
export function nextInRoutine(templates, finished, now = new Date()) {
  const days = orderedDays(templates)
  if (days.length === 0) return null
  const ids = new Set(days.map((day) => day.id))
  const last = finished.find((session) => session.templateId && ids.has(session.templateId))
  if (!last) return { day: days[0], index: 0, total: days.length, doneToday: null }
  const lastIndex = days.findIndex((day) => day.id === last.templateId)
  const index = (lastIndex + 1) % days.length
  const doneToday = dateKey(last.finishedAt) === dateKey(now) ? last : null
  return { day: days[index], index, total: days.length, doneToday }
}

export function dayLetter(index) {
  return String.fromCharCode(65 + (index % 26))
}
