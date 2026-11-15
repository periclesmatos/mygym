import { useCallback, useEffect, useState } from 'react'
import { normalizeText, prepareCatalog } from '@/features/catalog'
import { previousConfigs } from '@/features/routine/domain/drafts'
import { catalogApi } from '@/shared/api/catalog'
import { progressApi } from '@/shared/api/progress'
import { templatesApi } from '@/shared/api/routine'

const EMPTY = { items: [], used: new Set(), previous: new Map() }
let cache = null

/**
 * Catálogo de exercícios, nomes que o usuário já usou e como configurou cada um nas rotinas.
 * Mostra o que estiver em memória na hora e atualiza em segundo plano.
 */
export function useCatalog() {
  const [state, setState] = useState(cache || EMPTY)
  const [loading, setLoading] = useState(!cache)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setError('')
    return Promise.all([catalogApi.list(), progressApi.names(), templatesApi.list()])
      .then(([items, names, templates]) => {
        cache = {
          items: prepareCatalog(items),
          used: new Set(names.map(normalizeText)),
          previous: previousConfigs(templates)
        }
        setState(cache)
      })
      .catch((caught) => setError(caught.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /** Atualiza a lista na hora, sem buscar de novo. */
  const update = useCallback((change) => {
    setState((current) => {
      cache = { ...current, items: change(current.items) }
      return cache
    })
  }, [])

  const add = useCallback((item) => update((items) => [...items, ...prepareCatalog([item])]), [update])
  const remove = useCallback((id) => update((items) => items.filter((item) => item.id !== id)), [update])

  return { ...state, loading, error, reload: load, add, remove }
}
