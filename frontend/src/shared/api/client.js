import { clearToken, getToken } from './token'

/** Disparado quando a API recusa o token; o app escuta e manda para o login. */
export const AUTH_EXPIRED_EVENT = 'appgym:auth-expired'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

/** Chamada à API: JSON na ida e na volta, token no cabeçalho, erro com a mensagem do servidor. */
export async function request(path, { body, ...options } = {}) {
  const headers = { ...(options.headers || {}) }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(path, {
      ...options,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  } catch {
    throw new ApiError('Sem conexão com o servidor. Confira a internet e tente de novo.', 0)
  }

  const data = await readJson(response)
  if (response.status === 401 && !path.startsWith('/api/auth/')) {
    clearToken()
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
  }
  if (!response.ok) {
    throw new ApiError(data?.message || 'Não foi possível concluir. Tente de novo.', response.status)
  }
  return data
}

async function readJson(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
