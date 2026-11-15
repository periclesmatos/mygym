import { describe, expect, it } from 'vitest'
import { muscleGroup, muscleGroups, totalSets } from './muscles'

describe('muscleGroup', () => {
  it('reconhece pelo nome, sem acento nem caixa', () => {
    expect(muscleGroup('Supino Inclinado')).toBe('Peito')
    expect(muscleGroup('ELEVAÇÃO LATERAL com halteres')).toBe('Ombros')
    expect(muscleGroup('Puxada alta')).toBe('Costas')
    expect(muscleGroup('Agachamento livre')).toBe('Quadríceps')
  })

  it('aplica as regras específicas antes das genéricas', () => {
    expect(muscleGroup('Supino fechado')).toBe('Tríceps')
    expect(muscleGroup('Crucifixo invertido')).toBe('Ombros')
    expect(muscleGroup('Rosca punho')).toBe('Antebraço')
    expect(muscleGroup('Coice glúteo')).toBe('Glúteos')
  })

  it('aceita a grafia comum com erro', () => {
    expect(muscleGroup('Crussifixo')).toBe('Peito')
  })

  it('devolve null quando não reconhece', () => {
    expect(muscleGroup('Exercício X')).toBeNull()
    expect(muscleGroup('')).toBeNull()
  })
})

describe('muscleGroups', () => {
  it('ordena pelo total de séries e ignora os não reconhecidos', () => {
    const groups = muscleGroups([
      { name: 'Supino reto', plannedSets: 3 },
      { name: 'Elevação lateral', plannedSets: 4 },
      { name: 'Elevação lateral na polia', plannedSets: 3 },
      { name: 'Tríceps corda', plannedSets: 3 },
      { name: 'Algo novo', plannedSets: 5 }
    ])
    expect(groups).toEqual(['Ombros', 'Peito', 'Tríceps'])
  })
})

describe('totalSets', () => {
  it('soma as séries planejadas', () => {
    expect(totalSets([{ plannedSets: 3 }, { plannedSets: '4' }, {}])).toBe(7)
  })
})
