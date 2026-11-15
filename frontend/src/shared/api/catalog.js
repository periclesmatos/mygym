// Cliente HTTP do módulo catalog (catálogo de exercícios) do backend.
import { request } from './client'

/** Exercícios do app e os criados pelo usuário, com grupo e sugestões. */
export const catalogApi = {
  list: () => request('/api/exercises/catalog'),
  createCustom: (body) => request('/api/exercises/catalog', { method: 'POST', body }),
  removeCustom: (id) => request(`/api/exercises/catalog/${id}`, { method: 'DELETE' })
}
