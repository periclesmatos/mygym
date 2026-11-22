import { describe, expect, it } from 'vitest'
import { endsNextDay, periodForm, readPeriod, readStart } from './period'

const local = (day, hour, minute = 0, second = 0) => new Date(2026, 10, day, hour, minute, second).toISOString()
const now = new Date(2026, 10, 22, 12).getTime()

describe('periodForm', () => {
  it('mostra dia e horários locais', () => {
    expect(periodForm({ startedAt: local(20, 18, 30), finishedAt: local(20, 19, 45) })).toEqual({
      date: '2026-11-20',
      start: '18:30',
      end: '19:45'
    })
  })
  it('deixa o fim vazio quando passou de 24 h', () => {
    expect(periodForm({ startedAt: local(20, 18), finishedAt: local(21, 20) }).end).toBe('')
  })
})

describe('readPeriod', () => {
  const form = { date: '2026-11-20', start: '18:30', end: '19:45' }
  it('converte para ISO', () => {
    expect(readPeriod(form, {}, now)).toEqual({ startedAt: local(20, 18, 30), finishedAt: local(20, 19, 45) })
  })
  it('fim menor que o início é no dia seguinte', () => {
    const night = { date: '2026-11-20', start: '23:30', end: '00:30' }
    expect(endsNextDay(night)).toBe(true)
    expect(readPeriod(night, {}, now).finishedAt).toBe(local(21, 0, 30))
  })
  it('mantém os segundos do que não mudou', () => {
    const original = { startedAt: local(20, 18, 30, 42), finishedAt: local(20, 20, 0, 9) }
    expect(readPeriod(form, original, now)).toEqual({ startedAt: original.startedAt, finishedAt: local(20, 19, 45) })
  })
  it('recusa vazio, igual, futuro e ano absurdo', () => {
    expect(readPeriod({ ...form, end: '' }, {}, now).error).toBe('Informe o dia, o início e o fim.')
    expect(readPeriod({ ...form, end: '18:30' }, {}, now).error).toBe('O fim precisa ser depois do início.')
    expect(readPeriod({ date: '2026-11-22', start: '11:00', end: '12:30' }, {}, now).error).toMatch('futuro')
    expect(readPeriod({ ...form, date: '0202-11-20' }, {}, now).error).toBe('Data inválida.')
  })
})

describe('readStart', () => {
  it('converte ou recusa', () => {
    expect(readStart({ date: '2026-11-20', start: '07:05' }, now)).toEqual({ startedAt: local(20, 7, 5) })
    expect(readStart({ date: '2026-11-20', start: '' }, now).error).toBeTruthy()
    expect(readStart({ date: '2026-11-23', start: '07:00' }, now).error).toMatch('futuro')
  })
})
