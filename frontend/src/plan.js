import { dateKey } from './format'

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

export function streak(sessions, now = new Date()) {
  const days = new Set(sessions.map((session) => dateKey(session.finishedAt || session.startedAt)))
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let count = 0
  while (days.has(dateKey(cursor))) {
    count += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

export function monthStats(sessions, now = new Date()) {
  const prefix = dateKey(now).slice(0, 7)
  const inMonth = sessions.filter((session) => dateKey(session.finishedAt).startsWith(prefix))
  return {
    count: inMonth.length,
    sets: inMonth.reduce((sum, session) => sum + (session.completedSets || 0), 0),
    volume: inMonth.reduce((sum, session) => sum + Number(session.volume || 0), 0),
    minutes: Math.round(inMonth.reduce((sum, session) => sum + Number(session.durationSeconds || 0), 0) / 60)
  }
}

export function weekStart(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
}

export function sessionsByDay(sessions) {
  const map = new Map()
  for (const session of sessions) {
    const key = dateKey(session.finishedAt || session.startedAt)
    const list = map.get(key) || []
    list.push(session)
    map.set(key, list)
  }
  return map
}

export function dayPath(key, sessions) {
  if (!sessions?.length) return null
  if (sessions.length === 1) return `/historico/${sessions[0].id}`
  return `/historico/dia/${key}`
}

export function dayLetter(index) {
  return String.fromCharCode(65 + (index % 26))
}
