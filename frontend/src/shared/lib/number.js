export function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(String(value).trim().replace(',', '.'))
  return Number.isFinite(number) ? number : null
}

export function formatNumber(value, digits = 2) {
  const number = Number(value)
  if (!Number.isFinite(number)) return ''
  return number.toLocaleString('pt-BR', { maximumFractionDigits: digits })
}
