import { describe, expect, it } from 'vitest'
import { ageFrom, bmiFrom } from './body'

describe('dados corporais', () => {
  it('idade completa', () => {
    const now = new Date(2026, 10, 15)
    expect(ageFrom('1995-11-15', now)).toBe(31)
    expect(ageFrom('1995-11-16', now)).toBe(30)
    expect(ageFrom('', now)).toBeNull()
    expect(ageFrom('2030-01-01', now)).toBeNull()
  })
  it('IMC a partir dos campos', () => {
    expect(bmiFrom('70', '175')).toBeCloseTo(22.86, 2)
    expect(bmiFrom('70,5', '')).toBeNull()
  })
})
