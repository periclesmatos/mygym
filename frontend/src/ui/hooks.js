import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'

export function useAsync(loader, deps) {
  const [state, setState] = useState({ data: undefined, error: '', loading: true })
  const [tick, setTick] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    let active = true
    setState((current) => ({ ...current, loading: true, error: '' }))
    loaderRef.current()
      .then((data) => { if (active) setState({ data, error: '', loading: false }) })
      .catch((error) => { if (active) setState({ data: undefined, error: error.message, loading: false }) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((value) => value + 1), [])
  const setData = useCallback((update) => {
    setState((current) => ({ ...current, data: typeof update === 'function' ? update(current.data) : update }))
  }, [])
  return { ...state, reload, setData }
}

export function useNow(interval = 1000, enabled = true) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!enabled) return undefined
    const timer = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(timer)
  }, [interval, enabled])
  return now
}

let namesCache = null

export function useExerciseNames() {
  const [names, setNames] = useState(namesCache || [])
  useEffect(() => {
    let active = true
    api.exerciseNames().then((list) => {
      namesCache = list
      if (active) setNames(list)
    }).catch(() => {})
    return () => { active = false }
  }, [])
  return names
}
