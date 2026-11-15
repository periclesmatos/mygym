const KEY = 'appgym_theme'

export function savedTheme() {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(choice) {
  const resolved = choice === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : choice
  document.documentElement.dataset.theme = resolved
  document.documentElement.style.colorScheme = resolved
  try {
    if (choice === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, choice)
  } catch { /* sem armazenamento */ }
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = resolved === 'light' ? '#f4f4f1' : '#0e0f12'
  return choice
}
