import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAction } from '@/shared/hooks/useAction'
import { useAsync } from '@/shared/hooks/useAsync'
import { dateKey } from '@/shared/lib/date'
import { readStart } from '@/shared/lib/period'
import { Chips, DateField, TimeField } from '@/shared/ui/Fields'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Empty, ErrorState, Skeleton } from '@/shared/ui/States'
import { templatesApi } from '@/shared/api/routine'
import { sessionsApi } from '@/shared/api/workout'

const FREE = 'avulso'

export function RegisterPastPage() {
  const { data, error, loading, reload } = useAsync(
    () =>
      Promise.all([templatesApi.list(), sessionsApi.list('open')]).then(([templates, open]) => ({
        templates,
        open: open[0] || null
      })),
    []
  )
  return (
    <>
      <PageHeader back="/historico" title="Registrar treino passado" />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Skeleton lines={4} />}
      {data?.open && (
        <Empty
          icon="timer"
          title="Há um treino aberto"
          text={`Conclua ou descarte ${data.open.name} antes de registrar outro. Se ele já acabou, use "Concluir em outro horário" nas opções do treino.`}
        >
          <Link className="btn btn-primary" to={`/treino/${data.open.id}`}>
            Abrir treino
          </Link>
        </Empty>
      )}
      {data && !data.open && <RegisterForm templates={data.templates} />}
    </>
  )
}

function RegisterForm({ templates }) {
  const navigate = useNavigate()
  const runAction = useAction()
  const [date, setDate] = useState(() => dateKey(new Date()))
  const [start, setStart] = useState('')
  const [choice, setChoice] = useState(templates.length ? '' : FREE)
  const [name, setName] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    const { error, startedAt } = readStart({ date, start })
    const invalid = error || (choice ? '' : 'Escolha qual treino você fez.')
    setFormError(invalid)
    if (invalid) return
    const workout = choice === FREE ? { name: name.trim(), exercises: [] } : { templateId: Number(choice) }
    setBusy(true)
    await runAction(
      async () => {
        const session = await sessionsApi.create({ ...workout, startedAt })
        navigate(`/treino/${session.id}`, { replace: true })
      },
      () => {
        setBusy(false)
      }
    )
  }

  const options = [
    ...templates.map((template) => ({ value: String(template.id), label: template.name })),
    { value: FREE, label: 'Avulso' }
  ]

  return (
    <form className="card stack" onSubmit={submit} noValidate>
      <DateField label="Dia" max={dateKey(new Date())} value={date} onChange={setDate} />
      <TimeField label="Início" value={start} onChange={setStart} />
      <div className="field">
        <span className="field-label">Treino</span>
        <Chips label="Treino" options={options} value={choice} onChange={setChoice} />
      </div>
      {choice === FREE && (
        <label className="field">
          <span className="field-label">Nome (opcional)</span>
          <input className="input" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
      )}
      <p className="muted small">A seguir você marca as séries. O horário de fim é informado ao salvar.</p>
      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? 'Abrindo…' : 'Continuar'}
      </button>
    </form>
  )
}
