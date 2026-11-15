import { request } from '@/shared/api/client'

/** Todas as rotas daqui são públicas e devolvem { token, email }, exceto config. */
export const authApi = {
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (body) => request('/api/auth/register', { method: 'POST', body }),
  loginGoogle: (credential) => request('/api/auth/google', { method: 'POST', body: { credential } }),
  loginApple: (idToken, name) => request('/api/auth/apple', { method: 'POST', body: { idToken, name } }),
  /** Client IDs do Google e da Apple; null quando o provedor não está configurado. */
  config: () => request('/api/auth/config')
}
