import { request } from '@/shared/api/client'

export const profileApi = {
  get: () => request('/api/profile'),
  update: (body) => request('/api/profile', { method: 'PUT', body }),
  updatePhoto: (dataUrl) => request('/api/profile/photo', { method: 'PUT', body: { dataUrl } }),
  deletePhoto: () => request('/api/profile/photo', { method: 'DELETE' }),
  /** Devolve { token, email }: quem chama grava o token novo. */
  changeEmail: (email, currentPassword) =>
    request('/api/profile/email', { method: 'PUT', body: { email, currentPassword } }),
  changePassword: (currentPassword, newPassword) =>
    request('/api/profile/password', { method: 'PUT', body: { currentPassword, newPassword } })
}
