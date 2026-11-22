import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { localRequestKey } from '@/features/workout/domain/requestKey'
import { useAction } from '@/shared/hooks/useAction'
import { CARDIO_ACTIVITIES, INTENSITIES, parseCardio } from '@/shared/lib/cardio'
import { dateKey } from '@/shared/lib/date'
import { readStart } from '@/shared/lib/period'
import { Chips, DateField, Stepper, TimeField } from '@/shared/ui/Fields'
import { Sheet } from '@/shared/ui/Sheet'
import { sessionsApi } from '@/shared/api/workout'

const WHEN = [
  { value: 'now', label: 'Acabei agora' },
  { value: 'other', label: 'Foi antes' }
]

function emptyForm() {
  return {
    name: '',
    minutes: '30',
    km: '',
    intensity: 'moderate',
    when: 'now',
    date: dateKey(new Date()),
    start: '',
    key: localRequestKey()
  }
}

/** Registra um cardio que já terminou, sem abrir treino. */
export function CardioSheet({ open, onClose }) {
  const navigate = useNavigate()
  const runAction = useAction()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(emptyForm())
    setError('')
    setBusy(false)
  }, [open])

  function set(field) {
    return (value) => {
      setForm((current) => ({ ...current, [field]: value }))
      setError('')
    }
  }

  async function save() {
    if (!form.name) return setError('Escolha a atividade.')
    const { values, error: invalid } = parseCardio(form)
    if (invalid) return setError(invalid)
    if (!values.durationSeconds) return setError('Informe quantos minutos durou.')
    let finishedAt = null
    if (form.when === 'other') {
      const { error: invalidStart, startedAt } = readStart({ date: form.date, start: form.start })
      if (invalidStart) return setError(invalidStart)
      const end = new Date(startedAt).getTime() + values.durationSeconds * 1000
      if (end > Date.now() + 60000) return setError('Com essa duração, ainda não terminou.')
      finishedAt = new Date(end).toISOString()
    }
    setBusy(true)
    await runAction(async () => {
      const session = await sessionsApi.logCardio({ ...values, name: form.name, finishedAt, clientKey: form.key })
      onClose()
      navigate(`/historico/${session.id}`, { state: { justFinished: true, highlights: [] } })
    })
    setBusy(false)
  }

  const footer = (
    <button type="button" className="btn btn-primary btn-lg btn-block" disabled={busy} onClick={save}>
      {busy ? 'Salvando…' : 'Salvar cardio'}
    </button>
  )

  return (
    <Sheet open={open} onClose={onClose} title="Registrar cardio" footer={footer}>
      <div className="stack">
        <div className="field">
          <span className="field-label">Atividade</span>
          <Chips
            label="Atividade"
            options={CARDIO_ACTIVITIES.map((value) => ({ value, label: value }))}
            value={form.name}
            onChange={set('name')}
          />
        </div>
        <div className="grid-2">
          <Stepper label="Minutos" step={5} min={1} max={1440} value={form.minutes} onChange={set('minutes')} />
          <Stepper
            label="Distância"
            suffix="km"
            step={0.5}
            max={1000}
            allowEmpty
            value={form.km}
            onChange={set('km')}
          />
        </div>
        <div className="field">
          <span className="field-label">Intensidade</span>
          <Chips label="Intensidade" options={INTENSITIES} value={form.intensity} onChange={set('intensity')} />
        </div>
        <div className="field">
          <span className="field-label">Quando</span>
          <Chips label="Quando" options={WHEN} value={form.when} onChange={set('when')} />
        </div>
        {form.when === 'other' && (
          <>
            <DateField label="Dia" max={dateKey(new Date())} value={form.date} onChange={set('date')} />
            <TimeField label="Início" value={form.start} onChange={set('start')} />
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </Sheet>
  )
}
