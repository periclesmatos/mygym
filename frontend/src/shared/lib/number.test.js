import { describe, expect, it } from 'vitest'
import { formatNumber, numberOrNull } from './number'

describe('numberOrNull', () => {
  it('aceita vírgula decimal e espaços', () => {
    expect(numberOrNull(' 42,5 ')).toBe(42.5)
    expect(numberOrNull('10')).toBe(10)
  })
  it('vazio ou inválido vira null', () => {
    expect(numberOrNull('')).toBeNull()
    expect(numberOrNull(null)).toBeNull()
    expect(numberOrNull('abc')).toBeNull()
  })
})

describe('formatNumber', () => {
  it('usa o formato brasileiro', () => {
    expect(formatNumber(1234.5)).toBe('1.234,5')
    expect(formatNumber(2.456, 1)).toBe('2,5')
    expect(formatNumber('x')).toBe('')
  })
})
