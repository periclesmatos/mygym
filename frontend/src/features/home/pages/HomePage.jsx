import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { NextCard } from '@/features/home/components/NextCard'
import { OpenCard } from '@/features/home/components/OpenCard'
import { WeekStrip } from '@/features/home/components/WeekStrip'
import { greeting } from '@/features/home/domain/greeting'
import { PackSheet, dayLetter, nextInRoutine, orderedDays } from '@/features/routine'
import { useAction } from '@/shared/hooks/useAction'
import { useAsync } from '@/shared/hooks/useAsync'
import { monthStats, sessionsByDay, streak, weekStart } from '@/shared/lib/activity'
import { dateKey, formatDay, formatDuration, relativeDay } from '@/shared/lib/date'
import { plural } from '@/shared/lib/text'
import { formatVolume } from '@/shared/lib/training'
import { Avatar } from '@/shared/ui/Avatar'
import { Icon } from '@/shared/ui/Icon'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Action, ActionList, Sheet } from '@/shared/ui/Sheet'
import { StatCard } from '@/shared/ui/StatCard'
import { ErrorState, Skeleton } from '@/shared/ui/States'
import { useFeedback } from '@/shared/ui/feedbackContext'
import { profileApi } from '@/shared/api/identity'
import { templatesApi } from '@/shared/api/routine'
import { sessionsApi } from '@/shared/api/workout'

export function HomePage() {
  const navigate = useNavigate()
  const { toast, confirm } = useFeedback()
  const runAction = useAction()
  const [busy, setBusy] = useState(false)
  const [picker, setPicker] = useState(false)
  const [packs, setPacks] = useState(false)
  const [quickName, setQuickName] = useState('')
  const { data: profile } = useAsync(() => profileApi.get(), [])
  const { data, error, loading, reload } = useAsync(
    () =>
      Promise.all([templatesApi.list(), sessionsApi.list('open'), sessionsApi.list('finished')]).then(
        ([templates, open, finished]) => ({ templates, open: open[0] || null, finished })
      ),
    []
  )

  async function start(body) {
    setBusy(true)
    await runAction(
      async () => {
        const session = await sessionsApi.create(body)
        navigate(`/treino/${session.id}`)
      },
      () => {
        setBusy(false)
      }
    )
  }

  async function discard(session) {
    const ok = await confirm({
      title: 'Descartar treino?',
      message: `${session.name} será apagado, com todas as séries registradas. Não dá para desfazer.`,
      confirmLabel: 'Descartar',
      danger: true
    })
    if (!ok) return
    await runAction(async () => {
      await sessionsApi.remove(session.id)
      toast('Treino descartado.')
      reload()
    })
  }

  const firstName = profile?.name?.trim().split(/\s+/)[0] || ''
  const header = (
    <PageHeader
      large
      kicker={formatDay(new Date())}
      title={firstName ? `Olá, ${firstName}` : greeting()}
      actions={
        <Link to="/perfil" className="avatar-link" aria-label="Perfil">
          <Avatar profile={profile} size={44} />
        </Link>
      }
    />
  )

  if (error)
    return (
      <>
        {header}
        <ErrorState message={error} onRetry={reload} />
      </>
    )
  if (loading && !data)
    return (
      <>
        {header}
        <Skeleton lines={4} />
        <Skeleton lines={2} />
      </>
    )

  const { templates, open, finished } = data
  const next = nextInRoutine(templates, finished)
  const days = orderedDays(templates)
  const month = monthStats(finished)
  const currentStreak = streak(finished)
  const weekKey = dateKey(weekStart())
  const thisWeek = [...sessionsByDay(finished).keys()].filter((key) => key >= weekKey).length
  const recent = finished.slice(0, 3)

  return (
    <>
      {header}

      {open && <OpenCard session={open} onDiscard={() => discard(open)} />}

      <section className="section">
        <div className="section-head">
          <h2>Esta semana</h2>
          <span className="muted small">{plural(thisWeek, 'dia treinado', 'dias treinados')}</span>
        </div>
        <WeekStrip sessions={finished} />
      </section>

      <section className="stats">
        <StatCard icon="flame" value={currentStreak} label={currentStreak === 1 ? 'dia seguido' : 'dias seguidos'} />
        <StatCard icon="calendar" value={month.count} label={month.count === 1 ? 'treino no mês' : 'treinos no mês'} />
        <StatCard icon="dumbbell" value={formatVolume(month.volume) || '0 kg'} label="volume no mês" />
      </section>

      {!open && next && (
        <NextCard
          next={next}
          lastDone={finished.find((session) => session.templateId === next.day.id)}
          busy={busy}
          onStart={() => start({ templateId: next.day.id })}
          onSwap={() => setPicker(true)}
        />
      )}

      {!open && !next && (
        <section className="card hero onboarding">
          <span className="hero-icon">
            <Icon name="routine" size={26} />
          </span>
          <h2>Monte sua rotina</h2>
          <p className="muted">
            Crie os treinos da semana, como "Peito e tríceps" e "Costas e bíceps". O app alterna entre eles sozinho: ao
            concluir um, o próximo fica pronto.
          </p>
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => setPacks(true)}>
            <Icon name="routine" size={20} />
            Usar uma rotina pronta
          </button>
          <Link className="btn btn-secondary btn-block" to="/rotina/novo">
            <Icon name="plus" size={20} />
            Criar do zero
          </Link>
          <button type="button" className="btn btn-quiet btn-block" onClick={() => setPicker(true)}>
            Fazer um treino avulso
          </button>
        </section>
      )}

      {recent.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Últimos treinos</h2>
            <Link to="/historico" className="link-btn">
              Ver tudo
            </Link>
          </div>
          <div className="list">
            {recent.map((session) => (
              <Link key={session.id} to={`/historico/${session.id}`} className="list-item">
                <span className="list-main">
                  <strong>{session.name}</strong>
                  <span className="muted small">
                    {relativeDay(session.finishedAt)}
                    {session.durationSeconds ? ` · ${formatDuration(session.durationSeconds)}` : ''}
                    {` · ${plural(session.completedSets, 'série', 'séries')}`}
                  </span>
                </span>
                <Icon name="forward" size={18} className="muted" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <PackSheet
        open={packs}
        hasTemplates={false}
        onClose={() => setPacks(false)}
        onCreated={(pack) => {
          setPacks(false)
          toast(`Rotina ${pack.name} criada.`, 'success')
          reload()
        }}
      />

      <Sheet open={picker} onClose={() => setPicker(false)} title="Escolher treino">
        <div className="stack">
          {days.length > 0 && (
            <ActionList>
              {days.map((day, index) => (
                <Action
                  key={day.id}
                  icon={<span className="day-num">{dayLetter(index)}</span>}
                  label={day.name}
                  hint={`${plural(day.exercises.length, 'exercício', 'exercícios')}${next?.day.id === day.id ? ' · próximo da rotina' : ''}`}
                  disabled={busy || !!open}
                  onClick={() => start({ templateId: day.id })}
                />
              ))}
            </ActionList>
          )}
          <form
            className="quick-start"
            onSubmit={(event) => {
              event.preventDefault()
              start({ name: quickName.trim(), exercises: [] })
            }}
          >
            <span className="field-label">Treino avulso</span>
            <p className="muted small">Começa vazio. Você adiciona os exercícios durante o treino.</p>
            <div className="input-row">
              <input
                className="input"
                placeholder="Nome (opcional)"
                value={quickName}
                onChange={(event) => setQuickName(event.target.value)}
              />
              <button type="submit" className="btn btn-secondary" disabled={busy || !!open}>
                Começar
              </button>
            </div>
          </form>
          <Link className="link-btn" to="/historico/registrar">
            Esqueceu de registrar? Lance um treino passado
          </Link>
          {open && <p className="muted small">Conclua ou descarte o treino em andamento para começar outro.</p>}
        </div>
      </Sheet>
    </>
  )
}
