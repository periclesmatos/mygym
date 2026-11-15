const KEY = 'appgym_theme'

export function currentTheme() {
  const theme = document.documentElement.dataset.theme
  return theme === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  localStorage.setItem(KEY, theme)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = theme === 'light' ? '#f4f0ea' : '#0b0c0f'
  return theme
}

export function toggleTheme() {
  return applyTheme(currentTheme() === 'light' ? 'dark' : 'light')
}
