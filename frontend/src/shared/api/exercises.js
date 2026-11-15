import { request } from './client'

/** Histórico por exercício. */
export const exercisesApi = {
  names: () => request('/api/exercises'),
  /** Última vez de cada nome, indexada por exerciseKey(nome). */
  last: (names) => {
    const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))]
    if (unique.length === 0) return Promise.resolve({})
    const query = unique.map((name) => `names=${encodeURIComponent(name)}`).join('&')
    return request(`/api/exercises/last?${query}`)
  },
  progress: (name) => request(`/api/exercises/progress?name=${encodeURIComponent(name)}`)
}
