// Cliente HTTP do módulo ranking (rank dos 90 dias e troféus) do backend.
import { request } from './client'

export const rankingApi = {
  overview: () => request('/api/ranking'),
  details: () => request('/api/ranking/details'),
  trophies: () => request('/api/ranking/trophies'),
  impact: (sessionId) => request(`/api/ranking/impact/${sessionId}`)
}
