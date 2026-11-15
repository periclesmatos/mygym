import { describe, expect, it } from 'vitest'
import { draftFrom, findSet, highlights, nextOpenSet, parseDraft, previousSet } from './session'

const session = {
  exercises: [
    {
      name: 'Supino',
      sets: [
        { id: 1, position: 1, load: 40, reps: 10, completedAt: 'x' },
        { id: 2, position: 2, load: 40, reps: 8, completedAt: null }
      ]
    },
    { name: 'Remada', sets: [{ id: 3, position: 1, load: null, reps: null, completedAt: null }] }
  ]
}

describe('rascunho de série', () => {
  it('draftFrom vira texto', () => {
    expect(draftFrom({ reps: 10, load: '42.50', rir: null })).toEqual({ reps: '10', load: '42.5', rir: '' })
  })
  it('parseDraft converte e valida', () => {
    expect(parseDraft({ reps: '10', load: '42,5', rir: '' })).toEqual({ values: { reps: 10, load: 42.5, rir: null } })
    expect(parseDraft({ reps: '1.5', load: '', rir: '' }).error).toBe('Repetições inválidas.')
    expect(parseDraft({ reps: '', load: '10000', rir: '' }).error).toBe('Carga inválida.')
    expect(parseDraft({ reps: '', load: '', rir: '11' }).error).toBe('RIR deve ficar entre 0 e 10.')
  })
})

describe('navegação entre séries', () => {
  it('findSet', () => {
    expect(findSet(session, 3).position).toBe(1)
    expect(findSet(session, 99)).toBeNull()
  })
  it('nextOpenSet segue em frente e dá a volta', () => {
    expect(nextOpenSet(session, 1).set.id).toBe(2)
    expect(nextOpenSet(session, 3).set.id).toBe(2)
  })
  it('previousSet pela mesma posição', () => {
    const last = { supino: { sets: [{ position: 2, reps: 9, load: 35 }] } }
    expect(previousSet(last, session.exercises[0], session.exercises[0].sets[1]).reps).toBe(9)
    expect(previousSet(last, session.exercises[1], session.exercises[1].sets[0])).toBeNull()
  })
})

describe('highlights', () => {
  it('lista o que melhorou em relação à última vez', () => {
    const last = { supino: { topLoad: 37.5, topReps: 10 }, remada: { topLoad: 50, topReps: 10 } }
    expect(highlights(session, last)).toEqual([{ name: 'Supino', now: '40 × 10', before: '37,5 × 10' }])
  })
  it('peso do corpo compara repetições', () => {
    const bodyweight = { exercises: [{ name: 'Barra', sets: [{ load: null, reps: 12, completedAt: 'x' }] }] }
    expect(highlights(bodyweight, { barra: { topLoad: 0, topReps: 10 } })).toHaveLength(1)
    expect(highlights(bodyweight, { barra: { topLoad: 0, topReps: 12 } })).toHaveLength(0)
  })
})
