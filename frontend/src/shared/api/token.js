import { readItem, removeItem, writeItem } from '@/shared/lib/storage'

const TOKEN_KEY = 'appgym_token'

export function getToken() {
  return readItem(TOKEN_KEY)
}

export function setToken(token) {
  writeItem(TOKEN_KEY, token)
}

export function clearToken() {
  removeItem(TOKEN_KEY)
}
