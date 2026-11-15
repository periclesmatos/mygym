import { useCallback, useEffect, useRef, useState } from 'react'

export function useAsync(loader, deps) {
  const [state, setState] = useState({ data: undefined, error: '', loading: true })
  const [tick, setTick] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    let active = true
    setState((current) => ({ ...current, loading: true, error: '' }))
    loaderRef
      .current()
      .then((data) => {
        if (active) setState({ data, error: '', loading: false })
      })
      .catch((error) => {
        if (active) setState({ data: undefined, error: error.message, loading: false })
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((value) => value + 1), [])
  const setData = useCallback((update) => {
    setState((current) => ({ ...current, data: typeof update === 'function' ? update(current.data) : update }))
  }, [])
  return { ...state, reload, setData }
}
