import { describe, expect, it } from 'vitest'
import { ladderTiers } from './ladder'

const ladder = [
  { index: 0, key: 'a', name: 'A', floor: 0 },
  { index: 1, key: 'a', name: 'A', floor: 150 },
  { index: 2, key: 'b', name: 'B', floor: 300 },
  { index: 3, key: 'c', name: 'C', floor: 450 }
]

describe('ladderTiers', () => {
  it('marca passado, atual e quanto falta, do topo para a base', () => {
    const tiers = ladderTiers(ladder, { rank: ladder[2], points: 340, progress: 0.25 })
    expect(tiers.map((tier) => [tier.name, tier.state, tier.missing])).toEqual([
      ['C', 'ahead', 110],
      ['B', 'current', 0],
      ['A', 'passed', 0]
    ])
    expect(tiers.map((tier) => tier.steps.map((step) => step.fill))).toEqual([[0], [0.25], [1, 1]])
  })
  it('divisão atual enche parcialmente e a seguinte fica vazia', () => {
    const tiers = ladderTiers(ladder, { rank: ladder[0], points: 90, progress: 0.6 })
    expect(tiers[2].steps.map((step) => step.fill)).toEqual([0.6, 0])
  })
})
