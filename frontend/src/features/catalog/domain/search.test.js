import { describe, expect, it } from 'vitest'
import { findInCatalog, prepareCatalog, searchCatalog } from './search'

const ITEMS = prepareCatalog([
  {
    id: 1,
    name: 'Supino Reto com Barra',
    aliases: ['supino reto', 'bench press'],
    muscleGroup: 'Peito',
    plannedSets: 4,
    reps: '6-10',
    restSeconds: 150
  },
  {
    id: 2,
    name: 'Supino Inclinado com Halteres',
    aliases: [],
    muscleGroup: 'Peito',
    plannedSets: 3,
    reps: '8-12',
    restSeconds: 90
  },
  {
    id: 3,
    name: 'Crucifixo Reto com Halteres',
    aliases: ['crussifixo', 'fly'],
    muscleGroup: 'Peito',
    plannedSets: 3,
    reps: '10-15',
    restSeconds: 60
  },
  {
    id: 4,
    name: 'Elevação Lateral com Halteres',
    aliases: ['elevação lateral'],
    muscleGroup: 'Ombros',
    plannedSets: 3,
    reps: '10-15',
    restSeconds: 60
  },
  { id: 5, name: 'Supino Fechado', aliases: [], muscleGroup: 'Tríceps', plannedSets: 3, reps: '8-12', restSeconds: 90 }
])
const names = (list) => list.map((item) => item.name)

describe('searchCatalog', () => {
  it('acha por pedaços de palavra, sem acento', () => {
    expect(names(searchCatalog(ITEMS, 'sup inc'))).toEqual(['Supino Inclinado com Halteres'])
    expect(names(searchCatalog(ITEMS, 'ELEVACAO'))).toEqual(['Elevação Lateral com Halteres'])
  })

  it('acha pelos apelidos e grafias alternativas', () => {
    expect(names(searchCatalog(ITEMS, 'crussifixo'))).toEqual(['Crucifixo Reto com Halteres'])
    expect(names(searchCatalog(ITEMS, 'bench'))).toEqual(['Supino Reto com Barra'])
  })

  it('põe o começo do nome antes e, no empate, o que o usuário já fez', () => {
    expect(names(searchCatalog(ITEMS, 'supino'))[0]).toBe('Supino Fechado')
    const used = new Set(['supino reto com barra'])
    expect(names(searchCatalog(ITEMS, 'supino', { used }))[0]).toBe('Supino Reto com Barra')
  })

  it('filtra por grupo e, sem busca, lista o grupo inteiro', () => {
    expect(names(searchCatalog(ITEMS, '', { group: 'Ombros' }))).toEqual(['Elevação Lateral com Halteres'])
    expect(searchCatalog(ITEMS, 'supino', { group: 'Tríceps' })).toHaveLength(1)
    expect(searchCatalog(ITEMS, '')).toHaveLength(5)
  })
})

describe('findInCatalog', () => {
  it('casa nome ou apelido exato', () => {
    expect(findInCatalog(ITEMS, 'supino reto')?.id).toBe(1)
    expect(findInCatalog(ITEMS, 'Supino')).toBeNull()
  })
})
