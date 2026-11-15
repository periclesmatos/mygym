import { describe, expect, it } from 'vitest'
import {
  emptyExercise,
  exerciseFromTemplate,
  exercisePayload,
  exerciseSummary,
  validateExercise
} from './exerciseModel'

describe('modelo do formulário de exercício', () => {
  it('ida e volta entre API e formulário', () => {
    const form = exerciseFromTemplate({
      name: 'Supino',
      plannedSets: 3,
      reps: '8-12',
      load: 40,
      restSeconds: 90,
      rir: null,
      muscleGroup: 'Peito'
    })
    expect(form).toMatchObject({ plannedSets: '3', load: '40', rir: '', muscleGroup: 'Peito' })
    expect(exercisePayload({ ...form, name: ' Supino ', load: '42,5' })).toEqual({
      name: 'Supino',
      plannedSets: 3,
      reps: '8-12',
      load: 42.5,
      restSeconds: 90,
      rir: null,
      muscleGroup: 'Peito'
    })
    expect(exercisePayload({ ...form, muscleGroup: '' }).muscleGroup).toBeNull()
  })
  it('valida os campos', () => {
    const base = { ...emptyExercise(), name: 'Supino' }
    expect(validateExercise(base)).toBe('')
    expect(validateExercise({ ...base, name: ' ' })).toBe('Dê um nome ao exercício.')
    expect(validateExercise({ ...base, plannedSets: '0' })).toBe('Use de 1 a 20 séries.')
    expect(validateExercise({ ...base, load: '-1' })).toBe('Carga inválida.')
    expect(validateExercise({ ...base, rir: '11' })).toBe('RIR deve ficar entre 0 e 10.')
  })
  it('resumo legível', () => {
    expect(exerciseSummary({ plannedSets: '3', reps: '10', load: '40', rir: '2', restSeconds: '60' })).toBe(
      '3 × 10 · 40 kg · RIR 2 · 1 min'
    )
  })
  it('chaves locais únicas', () => {
    expect(emptyExercise().key).not.toBe(emptyExercise().key)
  })
})
