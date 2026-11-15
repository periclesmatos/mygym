// localStorage pode lançar (modo privado, armazenamento bloqueado): estas funções nunca lançam.

export function readItem(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeItem(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* sem armazenamento */
  }
}

export function removeItem(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* sem armazenamento */
  }
}

export function readJson(key) {
  const raw = readItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function writeJson(key, value) {
  writeItem(key, JSON.stringify(value))
}
