import { describe, expect, it } from 'vitest'
import { dayPath, isLive, monthStats, sessionsByDay, streak, weekStart } from './activity'

const at = (y, m, d, extra = {}) => ({ finishedAt: new Date(y, m, d, 18).toISOString(), ...extra })

describe('isLive', () => {
  const now = Date.parse('2026-11-22T12:00:00Z')
  it('até 4 h e não retroativo', () => {
    expect(isLive({ startedAt: '2026-11-22T08:00:00Z' }, now)).toBe(true)
    expect(isLive({ startedAt: '2026-11-22T07:59:59Z' }, now)).toBe(false)
    expect(isLive({ startedAt: '2026-11-22T11:00:00Z', backdated: true }, now)).toBe(false)
  })
})

describe('streak', () => {
  const now = new Date(2026, 10, 15, 12)
  it('conta dias seguidos até hoje', () => {
    expect(streak([at(2026, 10, 15), at(2026, 10, 14), at(2026, 10, 13), at(2026, 10, 10)], now)).toBe(3)
  })
  it('sem treino hoje, conta a partir de ontem', () => {
    expect(streak([at(2026, 10, 14), at(2026, 10, 13)], now)).toBe(2)
  })
  it('zero quando o último foi antes de ontem', () => {
    expect(streak([at(2026, 10, 12)], now)).toBe(0)
  })
})

describe('monthStats', () => {
  it('soma só o mês atual', () => {
    const stats = monthStats(
      [
        at(2026, 10, 2, { completedSets: 10, volume: '1000.00', durationSeconds: 3600 }),
        at(2026, 10, 9, { completedSets: 5, volume: '500', durationSeconds: 1800 }),
        at(2026, 9, 30, { completedSets: 99, volume: '9999', durationSeconds: 9999 })
      ],
      new Date(2026, 10, 15)
    )
    expect(stats).toEqual({ count: 2, sets: 15, volume: 1500, minutes: 90 })
  })
})

describe('semana e dias', () => {
  it('weekStart é a segunda-feira', () => {
    expect(weekStart(new Date(2026, 10, 15)).getDay()).toBe(1)
    expect(weekStart(new Date(2026, 10, 15)).getDate()).toBe(9)
  })
  it('sessionsByDay e dayPath', () => {
    const map = sessionsByDay([at(2026, 10, 15, { id: 1 }), at(2026, 10, 15, { id: 2 }), at(2026, 10, 14, { id: 3 })])
    expect(map.get('2026-11-15')).toHaveLength(2)
    expect(dayPath('2026-11-15', map.get('2026-11-15'))).toBe('/historico/dia/2026-11-15')
    expect(dayPath('2026-11-14', map.get('2026-11-14'))).toBe('/historico/3')
    expect(dayPath('2026-11-13', undefined)).toBeNull()
  })
})
