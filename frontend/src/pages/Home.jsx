import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { SettingsSheet } from '../components/SettingsSheet'
import { WeekStrip } from '../components/WeekStrip'
import { dateKey, estimateMinutes, formatClock, formatDay, formatDuration, formatVolume, plural, relativeDay } from '../format'
import { dayLetter, monthStats, nextInRoutine, orderedDays, sessionsByDay, streak, weekStart } from '../plan'
import { useFeedback } from '../ui/Feedback'
import { useAsync, useNow } from '../ui/hooks'
import { Icon, IconButton } from '../ui/Icon'
import { Action, ActionList, Sheet } from '../ui/Sheet'
import { ErrorState, Skeleton } from '../ui/States'

function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 5) return 'Boa noite'
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function Home() {
  const navigate = useNavigate()
  const { toast, confirm } = useFeedback()
  const [busy, setBusy] = useState(false)
  const [settings, setSettings] = useState(false)
  const [picker, setPicker] = useState(false)
  const [quickName, setQuickName] = useState('')
  const { data, error, loading, reload } = useAsync(
    () => Promise.all([api.templates(), api.sessions('open'), api.sessions('finished')])
      .then(([templates, open, finished]) => ({ templates, open: open[0] || null, finished })),
    []
  )

  async function start(body) {
    setBusy(true)
    try {
      const session = await api.createSession(body)
      navigate(`/treino/${session.id}`)
    } catch (caught) {
      toast(caught.message, 'error')
      setBusy(false)
    }
  }

  async function discard(session) {
    const ok = await confirm({
      title: 'Descartar treino?',
      message: `${session.name} será apagado, com todas as séries registradas. Não dá para desfazer.`,
      confirmLabel: 'Descartar',
      danger: true
    })
    if (!ok) return
    try {
      await api.deleteSession(session.id)
      toast('Treino descartado.')
      reload()
    } catch (caught) {
      toast(caught.message, 'error')
    }
  }

  const header = (
    <header className="home-header">
      <div>
        <p className="muted">{formatDay(new Date())}</p>
        <h1>{greeting()}</h1>
      </div>
      <IconButton icon="more" label="Ajustes" onClick={() => setSettings(true)} />
    </header>
  )

  if (error) return <>{header}<ErrorState message={error} onRetry={reload} /></>
  if (loading && !data) return <>{header}<Skeleton lines={4} /><Skeleton lines={2} /></>

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

      {open ? (
        <OpenCard session={open} onDiscard={() => discard(open)} />
      ) : next ? (
        <NextCard next={next} busy={busy} onStart={() => start({ templateId: next.day.id })} onSwap={() => setPicker(true)} />
      ) : (
        <section className="card hero onboarding">
          <span className="hero-icon"><Icon name="routine" size={26} /></span>
          <h2>Monte sua rotina</h2>
          <p className="muted">Crie os treinos da semana, como "Peito e tríceps" e "Costas e bíceps". O app alterna entre eles sozinho: ao concluir um, o próximo fica pronto.</p>
          <Link className="btn btn-primary btn-lg btn-block" to="/rotina/novo"><Icon name="plus" size={20} />Criar primeiro treino</Link>
          <button type="button" className="btn btn-quiet btn-block" onClick={() => setPicker(true)}>Fazer um treino avulso</button>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>Esta semana</h2>
          <span className="muted small">{plural(thisWeek, 'dia treinado', 'dias treinados')}</span>
        </div>
        <WeekStrip sessions={finished} />
      </section>

      <section className="stats">
        <div className="stat">
          <Icon name="flame" size={20} />
          <strong>{currentStreak}</strong>
          <span>{currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}</span>
        </div>
        <div className="stat">
          <Icon name="calendar" size={20} />
          <strong>{month.count}</strong>
          <span>{month.count === 1 ? 'treino no mês' : 'treinos no mês'}</span>
        </div>
        <div className="stat">
          <Icon name="dumbbell" size={20} />
          <strong>{formatVolume(month.volume) || '0 kg'}</strong>
          <span>volume no mês</span>
        </div>
      </section>

      {recent.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Últimos treinos</h2>
            <Link to="/historico" className="link-btn">Ver tudo</Link>
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
            onSubmit={(event) => { event.preventDefault(); start({ name: quickName.trim(), exercises: [] }) }}
          >
            <span className="field-label">Treino avulso</span>
            <p className="muted small">Começa vazio. Você adiciona os exercícios durante o treino.</p>
            <div className="input-row">
              <input className="input" placeholder="Nome (opcional)" value={quickName} onChange={(event) => setQuickName(event.target.value)} />
              <button type="submit" className="btn btn-secondary" disabled={busy || !!open}>Começar</button>
            </div>
          </form>
          {open && <p className="muted small">Conclua ou descarte o treino em andamento para começar outro.</p>}
        </div>
      </Sheet>

      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
    </>
  )
}

function OpenCard({ session, onDiscard }) {
  const now = useNow(1000)
  const elapsed = (now - new Date(session.startedAt).getTime()) / 1000
  const ratio = session.totalSets ? session.completedSets / session.totalSets : 0
  return (
    <section className="card hero live">
      <div className="hero-top">
        <span className="badge live-badge"><span className="pulse" />Em andamento</span>
        <span className="hero-clock">{formatClock(elapsed)}</span>
      </div>
      <h2 className="hero-title">{session.name}</h2>
      <p className="muted">{session.completedSets} de {session.totalSets} séries feitas</p>
      <div className="progress" aria-hidden="true"><span style={{ width: `${ratio * 100}%` }} /></div>
      <Link className="btn btn-primary btn-lg btn-block" to={`/treino/${session.id}`}><Icon name="play" size={18} filled />Continuar treino</Link>
      <button type="button" className="btn btn-quiet btn-block danger-text" onClick={onDiscard}>Descartar</button>
    </section>
  )
}

function NextCard({ next, busy, onStart, onSwap }) {
  const { day, index, total, doneToday } = next
  const preview = day.exercises.slice(0, 5)
  const hidden = day.exercises.length - preview.length
  return (
    <section className="card hero">
      {doneToday && (
        <Link to={`/historico/${doneToday.id}`} className="done-banner">
          <Icon name="check" size={18} strokeWidth={3} />
          <span><strong>{doneToday.name}</strong> concluído hoje{doneToday.durationSeconds ? ` em ${formatDuration(doneToday.durationSeconds)}` : ''}</span>
          <Icon name="forward" size={16} />
        </Link>
      )}
      <div className="hero-top">
        <span className="badge">{doneToday ? 'Próximo treino' : 'Treino de hoje'}</span>
        <span className="muted small">Treino {dayLetter(index)} · {index + 1} de {total}</span>
      </div>
      <h2 className="hero-title">{day.name}</h2>
      <p className="muted">{plural(day.exercises.length, 'exercício', 'exercícios')} · cerca de {estimateMinutes(day.exercises)} min</p>
      <ul className="hero-list">
        {preview.map((exercise) => (
          <li key={exercise.id}>
            <span>{exercise.name}</span>
            <span className="muted">{exercise.plannedSets} × {exercise.reps}</span>
          </li>
        ))}
        {hidden > 0 && <li className="muted">+ {plural(hidden, 'exercício', 'exercícios')}</li>}
      </ul>
      <button type="button" className={doneToday ? 'btn btn-secondary btn-lg btn-block' : 'btn btn-primary btn-lg btn-block'} disabled={busy} onClick={onStart}>
        <Icon name="play" size={18} filled />{busy ? 'Começando…' : 'Começar treino'}
      </button>
      <button type="button" className="btn btn-quiet btn-block" onClick={onSwap}>Escolher outro treino</button>
    </section>
  )
}
