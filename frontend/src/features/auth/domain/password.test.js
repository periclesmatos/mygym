import { describe, expect, it } from 'vitest'
import { MIN_PASSWORD_LENGTH, passwordError } from './password'

describe('passwordError', () => {
  it('exige o mínimo do backend', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(6)
    expect(passwordError('12345')).toBe('A senha precisa ter pelo menos 6 caracteres.')
    expect(passwordError('123', 'A nova senha')).toMatch(/^A nova senha/)
    expect(passwordError('123456')).toBe('')
  })
})
