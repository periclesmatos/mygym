import { numberOrNull } from '@/shared/lib/number'

/** Idade completa em anos a partir de 'AAAA-MM-DD'; null se vazio ou no futuro. */
export function ageFrom(birthDate, now = new Date()) {
  if (!birthDate) return null
  const [year, month, day] = birthDate.split('-').map(Number)
  let age = now.getFullYear() - year
  if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) age -= 1
  return age >= 0 ? age : null
}

/** IMC (kg/m²) a partir dos textos dos campos; null se faltar peso ou altura. */
export function bmiFrom(weight, height) {
  const kg = numberOrNull(weight)
  const cm = numberOrNull(height)
  if (!kg || !cm) return null
  return kg / (cm / 100) ** 2
}
