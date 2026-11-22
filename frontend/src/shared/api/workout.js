// Cliente HTTP do módulo workout (treinos feitos e em andamento) do backend.
import { request } from './client'

/** Treinos feitos ou em andamento, com exercícios e séries. */
export const sessionsApi = {
  /** status: 'open' | 'finished' */
  list: (status) => request(`/api/sessions?status=${status}`),
  get: (id) => request(`/api/sessions/${id}`),
  create: (body) => request('/api/sessions', { method: 'POST', body }),
  remove: (id) => request(`/api/sessions/${id}`, { method: 'DELETE' }),
  /** Sem `period` encerra agora. */
  finish: (id, period) => request(`/api/sessions/${id}/finish`, { method: 'POST', body: period }),
  changePeriod: (id, period) => request(`/api/sessions/${id}/period`, { method: 'PUT', body: period }),
  addExercise: (id, body) => request(`/api/sessions/${id}/exercises`, { method: 'POST', body }),
  removeExercise: (id, exerciseId) => request(`/api/sessions/${id}/exercises/${exerciseId}`, { method: 'DELETE' }),
  addSet: (id, exerciseId) => request(`/api/sessions/${id}/exercises/${exerciseId}/sets`, { method: 'POST' }),
  updateSet: (id, setId, body) => request(`/api/sessions/${id}/sets/${setId}`, { method: 'PUT', body }),
  removeSet: (id, setId) => request(`/api/sessions/${id}/sets/${setId}`, { method: 'DELETE' })
}
