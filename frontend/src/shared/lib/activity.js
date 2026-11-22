import { dateKey } from '@/shared/lib/date'

/** Depois disto, um treino aberto é tratado como esquecido. */
export const LIVE_LIMIT = 4 * 60 * 60 * 1000

/** Acontecendo agora: com relógio, descanso e fim no momento de concluir. */
export function isLive(session, now = Date.now()) {
  return !session.backdated && now - new Date(session.startedAt).getTime() <= LIVE_LIMIT
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
