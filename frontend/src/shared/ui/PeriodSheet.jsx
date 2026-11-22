import { useState } from 'react'
import { dateKey } from '@/shared/lib/date'
import { endsNextDay, periodForm, readPeriod } from '@/shared/lib/period'
import { DateField, TimeField } from '@/shared/ui/Fields'
import { Sheet } from '@/shared/ui/Sheet'

/** Folha com dia, início e fim. `period` é o valor inicial; `onSave` recebe os dois em ISO. */
export function PeriodSheet({ open, onClose, title, subtitle, period, busy, onSave }) {
  return (
    <Sheet open={open} onClose={onClose} title={title} subtitle={subtitle}>
      {period && <PeriodForm period={period} busy={busy} onSave={onSave} />}
    </Sheet>
  )
}

function PeriodForm({ period, busy, onSave }) {
  const [form, setForm] = useState(() => periodForm(period))
  const [error, setError] = useState('')

  const update = (field) => (value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  function submit(event) {
    event.preventDefault()
    const { error: invalid, ...values } = readPeriod(form, period)
    if (invalid) setError(invalid)
    else onSave(values)
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <DateField label="Dia" max={dateKey(new Date())} value={form.date} onChange={update('date')} />
      <div className="grid-2">
        <TimeField label="Início" value={form.start} onChange={update('start')} />
        <TimeField label="Fim" value={form.end} onChange={update('end')} />
      </div>
      {endsNextDay(form) && <p className="muted small">Termina no dia seguinte.</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  )
}
