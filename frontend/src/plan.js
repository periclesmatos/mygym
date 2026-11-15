import { dateKey } from './format'

export function orderedDays(templates) {
  return [...templates].sort((a, b) => a.position - b.position || a.id - b.id)
}

export function todayWorkout(templates, finished, now = new Date()) {
  const days = orderedDays(templates)
  if (days.length === 0) return null
  const ids = new Set(days.map((day) => day.id))
  const last = finished.find((session) => session.templateId && ids.has(session.templateId))
  if (!last) {
    return { day: days[0], index: 0, total: days.length, doneToday: false, next: days[1] || null }
  }
  const lastIndex = days.findIndex((day) => day.id === last.templateId)
  const doneToday = dateKey(last.finishedAt || last.startedAt) === dateKey(now)
  if (doneToday && lastIndex >= 0) {
    const nextIndex = (lastIndex + 1) % days.length
    return {
      day: days[lastIndex],
      index: lastIndex,
      total: days.length,
      doneToday: true,
      sessionId: last.id,
      next: days.length > 1 ? days[nextIndex] : null
    }
  }
  const index = lastIndex < 0 ? 0 : (lastIndex + 1) % days.length
  return { day: days[index], index, total: days.length, doneToday: false, next: null }
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
  const inMonth = sessions.filter((session) => dateKey(session.finishedAt || session.startedAt).startsWith(prefix))
  return {
    count: inMonth.length,
    sets: inMonth.reduce((sum, session) => sum + (session.completedSets || 0), 0),
    volume: inMonth.reduce((sum, session) => sum + Number(session.volume || 0), 0)
  }
}

export function trainedPath(dayKey, sessions) {
  if (!sessions?.length) return null
  if (sessions.length === 1) return `/history/${sessions[0].id}`
  return `/history/dia/${dayKey}`
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
