import { useEffect, useRef, useState } from 'react'
import { readRest, writeRest } from '@/features/workout/services/restStorage'

/**
 * Descanso entre séries. `now` vem de useNow (relógio da tela); `onEnd` roda uma vez quando o
 * tempo acaba sozinho (não quando é pulado).
 */
export function useRestTimer(sessionId, now, onEnd) {
  const [rest, setRest] = useState(() => readRest(sessionId))
  const alerted = useRef(0)
  const onEndRef = useRef(onEnd)
  useEffect(() => {
    onEndRef.current = onEnd
  })

  const remaining = rest ? Math.min(rest.total, Math.max(0, Math.ceil((rest.endsAt - now) / 1000))) : 0

  function save(value) {
    setRest(value)
    writeRest(value)
  }

  useEffect(() => {
    if (!rest || rest.endsAt > now || alerted.current === rest.endsAt) return
    alerted.current = rest.endsAt
    onEndRef.current?.()
    setRest(null)
    writeRest(null)
  }, [now, rest])

  function start(seconds, label) {
    save({ sessionId, endsAt: Date.now() + seconds * 1000, total: seconds, label })
  }

  function adjust(delta) {
    if (!rest) return
    const endsAt = Math.max(Date.now(), rest.endsAt + delta * 1000)
    const left = Math.ceil((endsAt - Date.now()) / 1000)
    if (left <= 0) {
      skip()
      return
    }
    save({ ...rest, endsAt, total: Math.max(rest.total, left) })
  }

  function skip() {
    if (rest) alerted.current = rest.endsAt
    save(null)
  }

  return { rest, remaining, start, adjust, skip, clear: () => save(null) }
}
