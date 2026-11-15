import { readItem, removeItem, writeItem } from '@/shared/lib/storage'

const KEY = 'appgym_theme'

/** 'light' | 'dark' | 'system' (padrão: segue o aparelho). */
export function savedTheme() {
  const value = readItem(KEY)
  return value === 'light' || value === 'dark' ? value : 'system'
}

export function applyTheme(choice) {
  const resolved =
    choice === 'system' ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : choice
  document.documentElement.dataset.theme = resolved
  document.documentElement.style.colorScheme = resolved
  if (choice === 'system') removeItem(KEY)
  else writeItem(KEY, choice)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = resolved === 'light' ? '#f4f4f1' : '#0e0f12'
  return choice
}
