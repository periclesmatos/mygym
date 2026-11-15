import { describe, expect, it } from 'vitest'
import {
  bestSet,
  estimatedMax,
  estimateMinutes,
  exerciseKey,
  firstReps,
  formatSet,
  formatVolume,
  sessionTotals
} from './training'

const set = (load, reps, done = true) => ({ load, reps, completedAt: done ? '2026-01-01T10:00:00Z' : null })

describe('formatação de treino', () => {
  it('formatVolume em kg ou toneladas', () => {
    expect(formatVolume(850)).toBe('850 kg')
    expect(formatVolume(12500)).toBe('12,5 t')
    expect(formatVolume(0)).toBeNull()
  })
  it('formatSet com e sem carga', () => {
    expect(formatSet(40, 10)).toBe('40 × 10')
    expect(formatSet(0, 12)).toBe('12 reps')
    expect(formatSet(null, null)).toBe('—')
  })
  it('firstReps pega o primeiro número da meta', () => {
    expect(firstReps('8-12')).toBe('8')
    expect(firstReps('até a falha')).toBe('')
  })
  it('exerciseKey normaliza o nome como a API', () => {
    expect(exerciseKey('  Supino Reto ')).toBe('supino reto')
  })
})

describe('cálculos', () => {
  it('estimatedMax pela fórmula de Epley', () => {
    expect(estimatedMax(100, 10)).toBeCloseTo(133.33, 2)
    expect(estimatedMax(0, 10)).toBe(0)
  })
  it('estimateMinutes arredonda para 5 min', () => {
    expect(estimateMinutes([{ plannedSets: 3, restSeconds: 90 }])).toBe(5)
    expect(estimateMinutes([])).toBe(5)
  })
  it('sessionTotals conta só séries feitas no volume', () => {
    const session = {
      startedAt: '2026-01-01T10:00:00Z',
      finishedAt: '2026-01-01T11:00:00Z',
      exercises: [{ sets: [set(40, 10), set(40, 8, false), set(null, 12)] }]
    }
    expect(sessionTotals(session)).toEqual({ done: 2, total: 3, volume: 400, duration: 3600 })
  })
  it('bestSet: maior carga, e no empate mais reps', () => {
    expect(bestSet({ sets: [set(40, 10), set(50, 6), set(50, 8), set(80, 5, false)] })).toEqual({ load: 50, reps: 8 })
    expect(bestSet({ sets: [set(40, 10, false)] })).toBeNull()
  })
})
