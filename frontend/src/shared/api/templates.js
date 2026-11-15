import { request } from './client'

/** Treinos da rotina. */
export const templatesApi = {
  list: () => request('/api/templates'),
  get: (id) => request(`/api/templates/${id}`),
  create: (body) => request('/api/templates', { method: 'POST', body }),
  update: (id, body) => request(`/api/templates/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/api/templates/${id}`, { method: 'DELETE' }),
  reorder: (ids) => request('/api/templates/order', { method: 'PUT', body: { ids } })
}
