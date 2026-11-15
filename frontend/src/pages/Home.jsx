import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { MonthCalendar } from '../components/MonthCalendar'
import { dateKey, formatVolume } from '../format'
import { monthStats, sessionsByDay, streak, todayWorkout, trainedPath } from '../plan'

export function Home() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [open, setOpen] = useState(null)
  const [finished, setFinished] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([api.templates(), api.sessions('open'), api.sessions('finished')])
      .then(([templateList, openSessions, finishedSessions]) => {
        if (!active) return
        setTemplates(templateList)
        setOpen(openSessions[0] || null)
        setFinished(finishedSessions)
        setReady(true)
      })
      .catch((caught) => { if (active) setError(caught.message) })
    return () => { active = false }
  }, [])

  async function start(templateId) {
    setBusyId(templateId)
    setError('')
    try {
      const session = await api.createSession({ templateId })
      navigate(`/workout/${session.id}`)
    } catch (caught) {
      setError(caught.message)
      setBusyId(null)
    }
  }

  const today = todayWorkout(templates, finished)
  const stats = monthStats(finished)
  const days = streak(finished)
  const volume = formatVolume(stats.volume)
  const openIsToday = today && open?.templateId === today.day.id
  const preview = today?.day.exercises || []
  const dateLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="stage">
      <p className="page-kicker">{dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}</p>
      <div className="home-title">
        <h1>{ready && today ? (today.doneToday ? 'Feito' : 'Agora') : 'Hoje'}</h1>
        {ready && <p className="home-pulse">{days} {days === 1 ? 'dia' : 'dias'} · {stats.count} no mês</p>}
      </div>
      {error && <p className="error">{error}</p>}
      {!ready && !error && <p className="muted">Carregando…</p>}
      {ready && <WeekStrip sessions={finished} />}
      {open && !openIsToday && (
        <Link className="open-banner" to={`/workout/${open.id}`}>
          <span>
            <strong>Treino aberto</strong>
            <span className="muted small">{open.name}</span>
          </span>
          <span>Continuar</span>
        </Link>
      )}

      {ready && !today && (
        <section className="card">
          <strong>Meu treino ainda está vazio</strong>
          <p className="muted">Monte a sequência. O primeiro dia vira o treino de hoje, e cada treino encerrado avança para o próximo.</p>
          <Link className="primary wide" to="/templates">Montar meu treino</Link>
        </section>
      )}

      {ready && today && (
        <section className={today.doneToday ? 'card today-card done' : 'card today-card'}>
          <div className="today-head">
            <div>
              <p className="eyebrow">{today.doneToday ? 'Feito hoje' : 'Treino de hoje'}</p>
              <h2 className="today-name">{today.day.name}</h2>
              <p className="muted">Dia {today.index + 1} de {today.total} · {today.day.exercises.length === 1 ? '1 exercício' : `${today.day.exercises.length} exercícios`}</p>
            </div>
            <CycleRing index={today.index} total={today.total} />
          </div>
          <ul className="ex-rows">
            {preview.map((exercise) => (
              <li key={exercise.id}>
                <span>{exercise.name}</span>
                <span>{exercise.plannedSets}×{exercise.reps}</span>
              </li>
            ))}
          </ul>
          {today.doneToday && <Link className="secondary wide" to={`/history/${today.sessionId}`}>Ver o treino de hoje</Link>}
          {today.doneToday && today.next && (
            <button type="button" className="text-button wide" disabled={!!open || busyId === today.next.id} onClick={() => start(today.next.id)}>
              Próximo: {today.next.name}
            </button>
          )}
          {!today.doneToday && openIsToday && <Link className="primary wide" to={`/workout/${open.id}`}>Continuar treino</Link>}
          {!today.doneToday && !openIsToday && (
            <button type="button" className="primary wide" disabled={!!open || busyId === today.day.id} onClick={() => start(today.day.id)}>
              {busyId === today.day.id ? 'Começando…' : 'Começar'}
            </button>
          )}
          {open && !openIsToday && <p className="muted small">Encerre o treino atual para começar outro.</p>}
        </section>
      )}

      {ready && (
        <>
          <div className="stats">
            <div className="stat"><Count value={days} /><span>{days === 1 ? 'dia seguido' : 'dias seguidos'}</span></div>
            <div className="stat"><Count value={stats.count} /><span>{stats.count === 1 ? 'treino no mês' : 'treinos no mês'}</span></div>
            <div className="stat"><Count value={stats.sets} /><span>{stats.sets === 1 ? 'série no mês' : 'séries no mês'}</span></div>
          </div>
          <p className="muted small motivation">{motivation(days, stats.count, volume)}</p>
        </>
      )}

      {ready && <MonthCalendar sessions={finished} />}

      <div className="action-row">
        <Link className="secondary" to="/workout/new">Treino avulso</Link>
        <Link className="secondary" to="/templates">Editar sequência</Link>
      </div>
    </div>
  )
}

const WEEK = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

function WeekStrip({ sessions }) {
  const byDay = sessionsByDay(sessions)
  const today = new Date()
  const todayKey = dateKey(today)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7))
  return (
    <div className="week" aria-label="Semana">
      {WEEK.map((label, index) => {
        const date = new Date(start)
        date.setDate(start.getDate() + index)
        const key = dateKey(date)
        const daySessions = byDay.get(key) || []
        const className = ['week-day', key === todayKey ? 'today' : '', daySessions.length ? 'trained' : ''].filter(Boolean).join(' ')
        if (!daySessions.length) {
          return (
            <div className={className} key={key}>
              <span>{label}</span>
              <strong>{date.getDate()}</strong>
            </div>
          )
        }
        return (
          <Link className={className} key={key} to={trainedPath(key, daySessions)} aria-label={`Abrir treino de ${date.getDate()}`}>
            <span>{label}</span>
            <strong>{date.getDate()}</strong>
          </Link>
        )
      })}
    </div>
  )
}

function CycleRing({ index, total }) {
  const radius = 28
  const length = 2 * Math.PI * radius
  const value = total ? (index + 1) / total : 0
  return (
    <svg className="cycle-ring" viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r={radius} />
      <circle className="arc" cx="36" cy="36" r={radius} style={{ strokeDasharray: length, strokeDashoffset: length * (1 - value) }} />
      <text x="36" y="41">{index + 1}</text>
    </svg>
  )
}

function Count({ value }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setShown(value)
      return undefined
    }
    const start = performance.now()
    let frame = 0
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / 650)
      const eased = 1 - (1 - progress) ** 3
      setShown(Math.round(value * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <strong>{shown}</strong>
}

function motivation(days, count, volume) {
  if (count === 0 && days === 0) return 'Cada treino encerrado aparece no calendário com o nome do dia.'
  if (days >= 3) return `${days} dias seguidos. Segue nessa.${volume ? ` ${volume} movimentados neste mês.` : ''}`
  if (volume) return `${volume} movimentados neste mês.`
  if (count === 1) return 'Primeiro treino do mês registrado.'
  return `${count} treinos neste mês.`
}
