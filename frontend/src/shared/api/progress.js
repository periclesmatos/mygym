// Cliente HTTP do módulo progress (última vez e evolução por exercício) do backend.
import { request } from './client'

/** Histórico por exercício. */
export const progressApi = {
  /** Todos os nomes de exercício já usados em rotinas e treinos. */
  names: () => request('/api/exercises'),
  /** Última vez de cada nome, indexada por exerciseKey(nome). `before` (ISO) ignora o que veio depois. */
  last: (names, before) => {
    const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))]
    if (unique.length === 0) return Promise.resolve({})
    const query = unique.map((name) => `names=${encodeURIComponent(name)}`).join('&')
    const limit = before ? `&before=${encodeURIComponent(before)}` : ''
    return request(`/api/exercises/last?${query}${limit}`)
  },
  progress: (name) => request(`/api/exercises/progress?name=${encodeURIComponent(name)}`)
}
