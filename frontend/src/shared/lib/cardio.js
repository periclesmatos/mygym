import { formatNumber, numberOrNull } from '@/shared/lib/number'

export const CARDIO_GROUP = 'Cardio'

export const INTENSITIES = [
  { value: 'light', label: 'Leve' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'intense', label: 'Intenso' }
]

export const CARDIO_ACTIVITIES = [
  'Esteira',
  'Corrida',
  'Caminhada',
  'Bicicleta Ergométrica',
  'Ciclismo',
  'Escada',
  'Elíptico',
  'Remo Ergométrico',
  'Pular Corda',
  'Natação',
  'Trilha',
  'HIIT',
  'Dança',
  'Outro cardio'
]

/** A meta está escrita em minutos: "20 min", "20-30 min". */
export function inMinutes(target) {
  return /^\d+(\s*-\s*\d+)?\s*min/i.test(String(target ?? '').trim())
}

/** Igual ao CardioTarget do backend: só o grupo não basta ("Remo 8-12" antigo é força). */
export function isCardio(exercise) {
  return exercise?.muscleGroup === CARDIO_GROUP && inMinutes(exercise.reps)
}

/** "20 min", "20-30 min" e "20" viram 20; o resto, null. */
export function targetMinutes(target) {
  const match = String(target ?? '')
    .trim()
    .match(/^(\d+)(?:\s*-\s*\d+)?(?:\s*min.*)?$/i)
  return match ? Number(match[1]) : null
}

/** Converte o que foi digitado para o que a API recebe, ou devolve { error }. */
export function parseCardio({ minutes, km, intensity }) {
  const time = numberOrNull(minutes)
  const distance = numberOrNull(km)
  if (String(minutes ?? '').trim() && (time == null || time < 1 || time > 1440)) return { error: 'Minutos inválidos.' }
  if (String(km ?? '').trim() && (distance == null || distance < 0 || distance > 1000))
    return { error: 'Distância inválida.' }
  return {
    values: {
      durationSeconds: time == null ? null : Math.round(time * 60),
      distanceMeters: distance == null ? null : Math.round(distance * 1000),
      intensity: intensity || null
    }
  }
}

export function formatKm(meters) {
  return meters > 0 ? `${formatNumber(meters / 1000, 2)} km` : ''
}

/** "30 min · 5 km" */
export function formatCardio(seconds, meters) {
  if (!seconds) return '—'
  return [`${formatNumber(seconds / 60, 0)} min`, formatKm(meters)].filter(Boolean).join(' · ')
}

export function intensityLabel(value) {
  return INTENSITIES.find((item) => item.value === value)?.label || 'Leve'
}
