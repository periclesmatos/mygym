const TOKEN_KEY = 'appgym_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(path, { ...options, headers })
  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (response.status === 401 && path !== '/api/login') {
    clearToken()
    if (window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Não foi possível concluir.')
    error.status = response.status
    throw error
  }
  return data
}

export const api = {
  login(email, password) {
    return request('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  },
  templates() {
    return request('/api/templates')
  },
  template(id) {
    return request(`/api/templates/${id}`)
  },
  createTemplate(body) {
    return request('/api/templates', { method: 'POST', body: JSON.stringify(body) })
  },
  updateTemplate(id, body) {
    return request(`/api/templates/${id}`, { method: 'PUT', body: JSON.stringify(body) })
  },
  deleteTemplate(id) {
    return request(`/api/templates/${id}`, { method: 'DELETE' })
  },
  reorderTemplates(ids) {
    return request('/api/templates/order', { method: 'PUT', body: JSON.stringify({ ids }) })
  },
  sessions(status) {
    return request(`/api/sessions?status=${status}`)
  },
  session(id) {
    return request(`/api/sessions/${id}`)
  },
  createSession(body) {
    return request('/api/sessions', { method: 'POST', body: JSON.stringify(body) })
  },
  addExercise(sessionId, body) {
    return request(`/api/sessions/${sessionId}/exercises`, { method: 'POST', body: JSON.stringify(body) })
  },
  addSet(sessionId, exerciseId) {
    return request(`/api/sessions/${sessionId}/exercises/${exerciseId}/sets`, { method: 'POST' })
  },
  updateSet(sessionId, setId, body) {
    return request(`/api/sessions/${sessionId}/sets/${setId}`, { method: 'PUT', body: JSON.stringify(body) })
  },
  finish(sessionId) {
    return request(`/api/sessions/${sessionId}/finish`, { method: 'POST' })
  }
}
