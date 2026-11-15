import { describe, expect, it } from 'vitest'
import { dateKey, formatClock, formatDuration, formatRest, parseDateKey, relativeDay } from './date'

describe('dateKey / parseDateKey', () => {
  it('usa a data local, ida e volta', () => {
    const date = new Date(2026, 0, 5, 23, 30)
    expect(dateKey(date)).toBe('2026-01-05')
    expect(parseDateKey('2026-01-05').getDate()).toBe(5)
    expect(dateKey('invalida')).toBe('')
  })
})

describe('relativeDay', () => {
  const now = new Date(2026, 10, 15, 12)
  it('hoje, ontem e dias recentes', () => {
    expect(relativeDay(new Date(2026, 10, 15, 8), now)).toBe('Hoje')
    expect(relativeDay(new Date(2026, 10, 14, 23), now)).toBe('Ontem')
    expect(relativeDay(new Date(2026, 10, 12), now)).toBe('Há 3 dias')
  })
  it('data curta para mais antigos', () => {
    expect(relativeDay(new Date(2026, 9, 1), now)).toMatch(/1 de out/)
    expect(relativeDay(new Date(2025, 9, 1), now)).toMatch(/2025/)
  })
})

describe('durações', () => {
  it('formatDuration', () => {
    expect(formatDuration(45)).toBe('45 s')
    expect(formatDuration(600)).toBe('10 min')
    expect(formatDuration(3900)).toBe('1 h 05')
  })
  it('formatClock', () => {
    expect(formatClock(65)).toBe('1:05')
    expect(formatClock(3725)).toBe('1:02:05')
    expect(formatClock(-3)).toBe('0:00')
  })
  it('formatRest com espaços que não quebram', () => {
    expect(formatRest(90)).toBe('1 min 30')
    expect(formatRest(60)).toBe('1 min')
    expect(formatRest(0)).toBe('sem descanso')
  })
})
