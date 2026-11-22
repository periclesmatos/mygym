// Cliente HTTP do módulo identity (login, cadastro e perfil) do backend.
import { request } from './client'

/** Todas as rotas daqui são públicas e devolvem { token, email }, exceto config. */
export const authApi = {
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (body) => request('/api/auth/register', { method: 'POST', body }),
  loginGoogle: (credential) => request('/api/auth/google', { method: 'POST', body: { credential } }),
  loginApple: (idToken, name) => request('/api/auth/apple', { method: 'POST', body: { idToken, name } }),
  /** Client IDs do Google e da Apple; null quando o provedor não está configurado. */
  config: () => request('/api/auth/config')
}

/** Perfil do usuário logado. */
export const profileApi = {
  get: () => request('/api/profile'),
  update: (body) => request('/api/profile', { method: 'PUT', body }),
  changeUsername: (username) => request('/api/profile/username', { method: 'PUT', body: { username } }),
  changeDiscovery: (body) => request('/api/profile/discovery', { method: 'PUT', body }),
  updatePhoto: (dataUrl) => request('/api/profile/photo', { method: 'PUT', body: { dataUrl } }),
  deletePhoto: () => request('/api/profile/photo', { method: 'DELETE' }),
  changePassword: (currentPassword, newPassword) =>
    request('/api/profile/password', { method: 'PUT', body: { currentPassword, newPassword } })
}
