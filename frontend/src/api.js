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

  if (response.status === 401 && path !== '/api/login') {
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
