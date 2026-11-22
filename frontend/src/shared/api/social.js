// Cliente HTTP do módulo social (amigos, pedidos e bloqueio) do backend.
import { request } from './client'

export const socialApi = {
  overview: () => request('/api/social'),
  pending: () => request('/api/social/pending'),
  /** No corpo, para e-mail e telefone não irem para o log de acesso. */
  search: (query) => request('/api/social/search', { method: 'POST', body: { query } }),
  request: (id) => request(`/api/social/requests/${id}`, { method: 'POST' }),
  accept: (id) => request(`/api/social/requests/${id}/accept`, { method: 'POST' }),
  remove: (id) => request(`/api/social/relations/${id}`, { method: 'DELETE' }),
  block: (id) => request(`/api/social/blocks/${id}`, { method: 'POST' }),
  unblock: (id) => request(`/api/social/blocks/${id}`, { method: 'DELETE' }),
  friend: (id) => request(`/api/social/friends/${id}`),
  photo: (id) => request(`/api/social/users/${id}/photo`)
}
