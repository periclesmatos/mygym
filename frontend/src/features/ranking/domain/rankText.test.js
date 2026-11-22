import { describe, expect, it } from 'vitest'
import { bonusLine, effortLine, impactText, nextLine, todayLine, warning } from './rankText'

describe('rankText', () => {
  it('diz quanto falta', () => {
    const next = { label: 'Sigma III' }
    const overview = { next, pointsToNext: 160, workoutsToNext: 2 }
    expect(nextLine(overview)).toBe('Faltam 160 para Sigma\u00a0III')
    expect(effortLine(overview)).toBe('Cerca de 2 treinos')
    expect(nextLine({ next: null })).toBe('Topo da escada. Agora é manter.')
  })
  it('mostra hoje e o bônus', () => {
    expect(todayLine({ today: { total: 0 } })).toBe('Hoje +0')
    expect(bonusLine({ nextBonus: { days: 1, points: 40 } })).toBe('Mais 1 dia na semana: +40 de bônus')
  })
  it('proteção vence os outros avisos', () => {
    const protection = { days: 4, pointsToKeep: 120 }
    expect(warning({ protection, expiresTomorrow: 84 }).text).toBe('Protegido por 4 dias: faça 120 pts para manter')
    expect(warning({ expiresTomorrow: 84 }).text).toBe('Amanhã saem 84 pts')
    expect(warning({ expiresTomorrow: 0 })).toBeNull()
  })
  it('explica treino que não pontua', () => {
    expect(impactText({ status: 'LATE', points: 0 }).title).toBe('Não pontua')
  })
})
