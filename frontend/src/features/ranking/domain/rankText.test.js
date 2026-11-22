import { describe, expect, it } from 'vitest'
import { impactText, nextLine, todayLine, warning } from './rankText'

describe('rankText', () => {
  it('diz quanto falta', () => {
    const next = { label: 'Casca Grossa III' }
    expect(nextLine({ next, pointsToNext: 160, workoutsToNext: 2 })).toBe(
      'Faltam 160 para Casca Grossa III, cerca de 2 treinos'
    )
    expect(nextLine({ next: null })).toBe('Topo da escada. Agora é manter.')
  })
  it('mostra hoje e o bônus', () => {
    expect(todayLine({ today: { total: 0 }, nextBonus: { days: 1, points: 40 } })).toBe(
      'Hoje +0 · mais 1 dia nesta semana = +40 de bônus'
    )
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
