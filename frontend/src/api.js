const TOKEN_KEY = 'appgym_token'

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY) } catch { /* sem armazenamento */ }
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(path, { ...options, headers })
  } catch {
    const error = new Error('Sem conexão com o servidor. Confira a internet e tente de novo.')
    error.status = 0
    throw error
  }

  const text = await response.text()
  let data = null
  if (text) {
    try { data = JSON.parse(text) } catch { data = null }
  }

  const publicAuth = path === '/api/login' || path.startsWith('/api/auth/')
  if (response.status === 401 && !publicAuth) {
    clearToken()
    if (window.location.pathname !== '/login') window.location.assign('/login')
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Não foi possível concluir. Tente de novo.')
    error.status = response.status
    throw error
  }
  return data
}

const json = (body) => JSON.stringify(body)

export const api = {
  login: (email, password) => request('/api/login', { method: 'POST', body: json({ email, password }) }),
  register: (body) => request('/api/auth/register', { method: 'POST', body: json(body) }),
  loginGoogle: (credential) => request('/api/auth/google', { method: 'POST', body: json({ credential }) }),
  loginApple: (idToken, name) => request('/api/auth/apple', { method: 'POST', body: json({ idToken, name }) }),
  authConfig: () => request('/api/auth/config'),

  profile: () => request('/api/profile'),
  updateProfile: (body) => request('/api/profile', { method: 'PUT', body: json(body) }),
  updatePhoto: (dataUrl) => request('/api/profile/photo', { method: 'PUT', body: json({ dataUrl }) }),
  deletePhoto: () => request('/api/profile/photo', { method: 'DELETE' }),
  changeEmail: async (email, currentPassword) => {
    const response = await request('/api/profile/email', { method: 'PUT', body: json({ email, currentPassword }) })
    setToken(response.token)
    return response
  },
  changePassword: (currentPassword, newPassword) => request('/api/profile/password', { method: 'PUT', body: json({ currentPassword, newPassword }) }),

  templates: () => request('/api/templates'),
  template: (id) => request(`/api/templates/${id}`),
  createTemplate: (body) => request('/api/templates', { method: 'POST', body: json(body) }),
  updateTemplate: (id, body) => request(`/api/templates/${id}`, { method: 'PUT', body: json(body) }),
  deleteTemplate: (id) => request(`/api/templates/${id}`, { method: 'DELETE' }),
  reorderTemplates: (ids) => request('/api/templates/order', { method: 'PUT', body: json({ ids }) }),

  sessions: (status) => request(`/api/sessions?status=${status}`),
  session: (id) => request(`/api/sessions/${id}`),
  createSession: (body) => request('/api/sessions', { method: 'POST', body: json(body) }),
  deleteSession: (id) => request(`/api/sessions/${id}`, { method: 'DELETE' }),
  addExercise: (id, body) => request(`/api/sessions/${id}/exercises`, { method: 'POST', body: json(body) }),
  removeExercise: (id, exerciseId) => request(`/api/sessions/${id}/exercises/${exerciseId}`, { method: 'DELETE' }),
  addSet: (id, exerciseId) => request(`/api/sessions/${id}/exercises/${exerciseId}/sets`, { method: 'POST' }),
  updateSet: (id, setId, body) => request(`/api/sessions/${id}/sets/${setId}`, { method: 'PUT', body: json(body) }),
  removeSet: (id, setId) => request(`/api/sessions/${id}/sets/${setId}`, { method: 'DELETE' }),
  finish: (id) => request(`/api/sessions/${id}/finish`, { method: 'POST' }),

  exerciseNames: () => request('/api/exercises'),
  lastPerformance: (names) => {
    const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))]
    if (unique.length === 0) return Promise.resolve({})
    const query = unique.map((name) => `names=${encodeURIComponent(name)}`).join('&')
    return request(`/api/exercises/last?${query}`)
  },
  progress: (name) => request(`/api/exercises/progress?name=${encodeURIComponent(name)}`)
}

export function exerciseKey(name) {
  return (name || '').trim().toLowerCase()
}
