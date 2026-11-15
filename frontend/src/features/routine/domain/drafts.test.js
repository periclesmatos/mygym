import { describe, expect, it } from 'vitest'
import { prepareCatalog } from '@/features/catalog'
import { draftFromCatalog, previousConfigs } from './drafts'

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

describe('draftFromCatalog', () => {
  it('usa a sugestão do catálogo quando o usuário nunca fez', () => {
    const draft = draftFromCatalog(ITEMS[0], new Map())
    expect(draft).toMatchObject({
      name: 'Supino Reto com Barra',
      plannedSets: '4',
      reps: '6-10',
      restSeconds: '150',
      load: '',
      muscleGroup: 'Peito'
    })
  })

  it('prefere como o usuário já configurou nas rotinas', () => {
    const previous = previousConfigs([
      { exercises: [{ name: 'supino reto com barra', plannedSets: 5, reps: '5', load: 80, restSeconds: 180, rir: 1 }] }
    ])
    expect(draftFromCatalog(ITEMS[0], previous)).toMatchObject({
      plannedSets: '5',
      reps: '5',
      load: '80',
      restSeconds: '180',
      rir: '1'
    })
  })
})
