import { describe, expect, it } from 'vitest'
import { draftFrom, findSet, highlights, nextOpenSet, parseDraft, previousSet, suggestedEnd } from './session'

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

describe('suggestedEnd', () => {
  const now = Date.parse('2026-11-22T12:00:00Z')
  const open = (times, extra = {}) => ({
    startedAt: '2026-11-21T18:00:30.000Z',
    exercises: [{ sets: times.map((completedAt) => ({ completedAt })) }],
    ...extra
  })
  it('usa a última série, arredondada para cima', () => {
    const times = ['2026-11-21T18:50:10Z', null, '2026-11-21T18:20:00Z']
    expect(suggestedEnd(open(times), now)).toBe('2026-11-21T18:51:00.000Z')
  })
  it('ignora série marcada no dia seguinte', () => {
    const times = ['2026-11-21T18:40:00Z', '2026-11-22T11:00:00Z']
    expect(suggestedEnd(open(times), now)).toBe('2026-11-21T18:40:00.000Z')
  })
  it('segue um treino longo sem pausa de 4 h', () => {
    const times = ['2026-11-21T21:00:00Z', '2026-11-21T23:00:00Z']
    expect(suggestedEnd(open(times), now)).toBe('2026-11-21T23:00:00.000Z')
  })
  it('sem pista ou retroativo, uma hora depois do início', () => {
    const fallback = '2026-11-21T19:00:30.000Z'
    expect(suggestedEnd(open([]), now)).toBe(fallback)
    expect(suggestedEnd(open(['2026-11-21T18:10:00Z'], { backdated: true }), now)).toBe(fallback)
  })
  it('nunca passa de agora', () => {
    const recent = { startedAt: '2026-11-22T11:30:00Z', backdated: true, exercises: [] }
    expect(suggestedEnd(recent, now)).toBe('2026-11-22T12:00:00.000Z')
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
