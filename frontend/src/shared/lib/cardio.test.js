import { describe, expect, it } from 'vitest'
import { formatCardio, isCardio, parseCardio, targetMinutes } from './cardio'

describe('cardio', () => {
  it('lê a meta em minutos', () => {
    expect(targetMinutes('20 min')).toBe(20)
    expect(targetMinutes('20-30 min')).toBe(20)
    expect(targetMinutes('45')).toBe(45)
    expect(targetMinutes('até a falha')).toBeNull()
  })
  it('converte minutos e km', () => {
    expect(parseCardio({ minutes: '30', km: '5,2', intensity: 'intense' })).toEqual({
      values: { durationSeconds: 1800, distanceMeters: 5200, intensity: 'intense' }
    })
    expect(parseCardio({ minutes: '0', km: '' }).error).toBe('Minutos inválidos.')
    expect(parseCardio({ minutes: '10', km: 'x' }).error).toBe('Distância inválida.')
  })
  it('grupo Cardio com meta em reps continua força', () => {
    expect(isCardio({ muscleGroup: 'Cardio', reps: '8-12' })).toBe(false)
    expect(isCardio({ muscleGroup: 'Cardio', reps: '20-30 min' })).toBe(true)
    expect(isCardio({ muscleGroup: 'Costas', reps: '1 min' })).toBe(false)
  })
  it('formata', () => {
    expect(formatCardio(1800, 5000)).toBe('30 min · 5 km')
    expect(formatCardio(600, null)).toBe('10 min')
  })
})
