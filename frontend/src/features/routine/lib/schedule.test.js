import { describe, expect, it } from 'vitest'
import { dayLetter, nextInRoutine, orderedDays } from './schedule'

const days = [
  { id: 2, position: 2, name: 'B' },
  { id: 1, position: 1, name: 'A' },
  { id: 3, position: 3, name: 'C' }
]

describe('rotina', () => {
  it('ordena pela posição', () => {
    expect(orderedDays(days).map((day) => day.name)).toEqual(['A', 'B', 'C'])
  })
  it('sem histórico, começa pelo primeiro', () => {
    expect(nextInRoutine(days, [])).toMatchObject({ index: 0, total: 3, doneToday: null })
  })
  it('depois do último feito vem o seguinte, dando a volta', () => {
    const now = new Date(2026, 10, 15, 20)
    const finished = [{ templateId: 3, finishedAt: new Date(2026, 10, 15, 8).toISOString() }]
    const next = nextInRoutine(days, finished, now)
    expect(next.day.name).toBe('A')
    expect(next.doneToday).toBe(finished[0])
  })
  it('ignora treinos avulsos', () => {
    const finished = [
      { templateId: null, finishedAt: '2026-11-15T10:00:00Z' },
      { templateId: 1, finishedAt: '2026-11-10T10:00:00Z' }
    ]
    expect(nextInRoutine(days, finished).day.name).toBe('B')
  })
  it('rotina vazia', () => {
    expect(nextInRoutine([], [])).toBeNull()
  })
  it('letras dos dias', () => {
    expect([0, 1, 25, 26].map(dayLetter)).toEqual(['A', 'B', 'Z', 'A'])
  })
})
