import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { RestTimer } from '../components/RestTimer'
import { emptyExercise, exercisePayload, formatLoad, formatRest, numberOrNull, validateExercises } from '../format'

function draftFrom(set) {
  return { reps: set.reps ?? '', load: set.load ?? '', rir: set.rir ?? '' }
}

function itemsOf(session) {
  if (!session) return []
  const items = []
  for (const exercise of session.exercises) {
    for (const set of exercise.sets) items.push({ exercise, set })
  }
  return items
}

function firstOpen(session) {
  return itemsOf(session).find((item) => !item.set.completedAt) || null
}

function roundStep(value) {
  return Math.round(value * 100) / 100
}

export function Workout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [rest, setRest] = useState(null)
  const [adding, setAdding] = useState(false)
  const [extra, setExtra] = useState(emptyExercise())
  const draftsRef = useRef({})
  const sessionRef = useRef(null)
  const timers = useRef({})
  const restToken = useRef(0)
  const advanced = useRef(0)

  useEffect(() => () => {
    for (const timer of Object.values(timers.current)) clearTimeout(timer)
  }, [])

  useEffect(() => {
    let active = true
    api.session(id).then((data) => {
      if (!active) return
      if (data.finishedAt) {
        navigate(`/history/${data.id}`, { replace: true })
        return
      }
      sessionRef.current = data
      setSession(data)
      const nextDrafts = Object.fromEntries(itemsOf(data).map(({ set }) => [set.id, draftFrom(set)]))
      draftsRef.current = nextDrafts
      setDrafts(nextDrafts)
    }).catch((caught) => { if (active) setError(caught.message) })
    return () => { active = false }
  }, [id, navigate])

  useEffect(() => {
    if (!rest || rest.seconds <= 0) return undefined
    const timer = setInterval(() => {
      setRest((current) => (current && current.seconds > 0 ? { ...current, seconds: current.seconds - 1 } : current))
    }, 1000)
    return () => clearInterval(timer)
  }, [rest?.token, rest?.seconds > 0])

  useEffect(() => {
    if (!rest || rest.seconds > 0) return
    if (advanced.current === rest.token) return
    advanced.current = rest.token
    try { navigator.vibrate?.(40) } catch { /* o aparelho pode recusar a vibração */ }
    setRest(null)
  }, [rest])

  function rememberDrafts(data) {
    setDrafts((current) => {
      const next = { ...current }
      for (const { set } of itemsOf(data)) {
        if (!next[set.id]) next[set.id] = draftFrom(set)
      }
      draftsRef.current = next
      return next
    })
  }

  function applySession(data) {
    sessionRef.current = data
    setSession(data)
  }

  function changeDraft(setId, field, value) {
    setDrafts((current) => {
      const next = { ...current, [setId]: { ...(current[setId] || {}), [field]: value } }
      draftsRef.current = next
      return next
    })
    clearTimeout(timers.current[setId])
    timers.current[setId] = setTimeout(() => {
      const set = itemsOf(sessionRef.current).find((item) => item.set.id === setId)?.set
      if (!set) return
      persist(set, draftsRef.current[setId], Boolean(set.completedAt))
    }, 400)
  }

  function nudge(setId, field, value, delta, min, max) {
    const current = numberOrNull(value)
    let next = roundStep((current == null ? 0 : current) + delta)
    if (next < min) next = min
    if (max != null && next > max) next = max
    changeDraft(setId, field, String(next))
  }

  async function persist(set, draft, completed) {
    clearTimeout(timers.current[set.id])
    const source = draft || draftsRef.current[set.id] || draftFrom(set)
    setSavingId(set.id)
    setError('')
    try {
      const updated = await api.updateSet(sessionRef.current.id, set.id, {
        reps: numberOrNull(source.reps),
        load: numberOrNull(source.load),
        rir: numberOrNull(source.rir),
        completed
      })
      applySession(updated)
      return updated
    } catch (caught) {
      setError(caught.message)
      return null
    } finally {
      setSavingId((current) => (current === set.id ? null : current))
    }
  }

  function openRest(exercise, updated) {
    const next = firstOpen(updated)
    if (!next || exercise.restSeconds <= 0) {
      setRest(null)
      return
    }
    restToken.current += 1
    setRest({
      token: restToken.current,
      seconds: exercise.restSeconds,
      total: exercise.restSeconds,
      nextLabel: `${next.exercise.name} · série ${next.set.position}`
    })
  }

  async function toggleSet(exercise, set) {
    const completed = !set.completedAt
    const updated = await persist(set, draftsRef.current[set.id], completed)
    if (!updated) return
    if (completed) openRest(exercise, updated)
    else setRest(null)
  }

  async function completeExercise(exercise) {
    let latest = sessionRef.current
    for (const set of exercise.sets) {
      const fresh = itemsOf(latest).find((item) => item.set.id === set.id)?.set
      if (!fresh || fresh.completedAt) continue
      const updated = await persist(fresh, draftsRef.current[set.id], true)
      if (!updated) return
      latest = updated
    }
    setRest(null)
  }

  async function addSet(exerciseId) {
    setError('')
    try {
      const updated = await api.addSet(session.id, exerciseId)
      applySession(updated)
      rememberDrafts(updated)
    } catch (caught) {
      setError(caught.message)
    }
  }

  async function addExercise(event) {
    event.preventDefault()
    const exerciseError = validateExercises([extra])
    if (exerciseError) { setError(exerciseError); return }
    try {
      const updated = await api.addExercise(session.id, exercisePayload(extra))
      applySession(updated)
      rememberDrafts(updated)
      setExtra(emptyExercise())
      setAdding(false)
    } catch (caught) {
      setError(caught.message)
    }
  }

  function adjustRest(delta) {
    setRest((current) => {
      if (!current) return current
      const seconds = Math.max(0, current.seconds + delta)
      return { ...current, seconds, total: Math.max(current.total, seconds) }
    })
  }

  function skipRest() {
    if (!rest) return
    advanced.current = rest.token
    setRest(null)
  }

  async function finish() {
    if (!window.confirm('Encerrar este treino?')) return
    try {
      const updated = await api.finish(session.id)
      navigate(`/history/${updated.id}`)
    } catch (caught) {
      setError(caught.message)
    }
  }

  if (error && !session) return <p className="error">{error}</p>
  if (!session) return <p className="muted">Carregando…</p>

  const items = itemsOf(session)
  const done = items.filter((item) => item.set.completedAt).length

  return (
    <div className={rest ? 'session has-rest' : 'session'}>
      <header className="session-top">
        <div>
          <h1>{session.name}</h1>
          <p className="muted">{done}/{items.length} séries</p>
        </div>
        <button type="button" className="finish" onClick={finish}>Encerrar</button>
      </header>
      <div className="progress" aria-hidden="true">
        <span style={{ width: items.length ? `${(done / items.length) * 100}%` : '0%' }} />
      </div>
      {error && <p className="error">{error}</p>}

      {session.exercises.map((exercise) => {
        const finishedSets = exercise.sets.filter((set) => set.completedAt).length
        return (
          <section className="card exercise-card" key={exercise.id}>
            <div className="row">
              <h2>{exercise.name}</h2>
              <span className="muted small">{finishedSets}/{exercise.sets.length}</span>
            </div>
            <p className="muted small">{targetLine(exercise)}</p>
            {exercise.sets.map((set) => {
              const draft = drafts[set.id] || draftFrom(set)
              return (
                <div className={set.completedAt ? 'set-block done' : 'set-block'} key={set.id}>
                  <div className="set-top">
                    <strong>Série {set.position}</strong>
                    <button
                      type="button"
                      className={set.completedAt ? 'check on' : 'check'}
                      aria-label={set.completedAt ? `Desfazer série ${set.position}` : `Concluir série ${set.position}`}
                      disabled={savingId === set.id}
                      onClick={() => toggleSet(exercise, set)}
                    >
                      {set.completedAt ? '✓' : ''}
                    </button>
                  </div>
                  <label className="set-field">
                    <span>Carga (kg)</span>
                    <Nudge
                      label={`Carga da série ${set.position}`}
                      value={draft.load}
                      step={2.5}
                      onChange={(value) => changeDraft(set.id, 'load', value)}
                      onStep={(delta) => nudge(set.id, 'load', draft.load, delta, 0)}
                    />
                  </label>
                  <label className="set-field">
                    <span>Repetições</span>
                    <input
                      className="log-input"
                      inputMode="numeric"
                      aria-label={`Reps da série ${set.position}`}
                      value={draft.reps}
                      onChange={(event) => changeDraft(set.id, 'reps', event.target.value)}
                    />
                  </label>
                  <label className="set-field">
                    <span>RIR, reserva</span>
                    <Nudge
                      label={`RIR da série ${set.position}`}
                      value={draft.rir}
                      step={1}
                      onChange={(value) => changeDraft(set.id, 'rir', value)}
                      onStep={(delta) => nudge(set.id, 'rir', draft.rir, delta, 0, 10)}
                    />
                  </label>
                </div>
              )
            })}
            <div className="row-actions">
              {finishedSets < exercise.sets.length && (
                <button type="button" className="text-button" onClick={() => completeExercise(exercise)}>Concluir exercício</button>
              )}
              <button type="button" className="text-button" onClick={() => addSet(exercise.id)}>+ série</button>
            </div>
          </section>
        )
      })}

      {done === items.length && items.length > 0 && (
        <button type="button" className="primary wide" onClick={finish}>Encerrar treino</button>
      )}

      {adding ? (
        <form className="card" onSubmit={addExercise}>
          <h2>Adicionar exercício</h2>
          <label className="field"><span>Nome</span><input value={extra.name} onChange={(event) => setExtra({ ...extra, name: event.target.value })} /></label>
          <div className="grid-3">
            <label className="field"><span>Séries</span><input inputMode="numeric" value={extra.plannedSets} onChange={(event) => setExtra({ ...extra, plannedSets: event.target.value })} /></label>
            <label className="field"><span>Reps</span><input value={extra.reps} onChange={(event) => setExtra({ ...extra, reps: event.target.value })} /></label>
            <label className="field"><span>Descanso</span><input inputMode="numeric" value={extra.restSeconds} onChange={(event) => setExtra({ ...extra, restSeconds: event.target.value })} /></label>
          </div>
          <div className="grid-2">
            <label className="field"><span>Carga</span><input inputMode="decimal" value={extra.load} onChange={(event) => setExtra({ ...extra, load: event.target.value })} /></label>
            <label className="field"><span>RIR</span><input inputMode="numeric" value={extra.rir} onChange={(event) => setExtra({ ...extra, rir: event.target.value })} /></label>
          </div>
          <div className="row-actions">
            <button className="primary" type="submit">Adicionar</button>
            <button className="text-button" type="button" onClick={() => setAdding(false)}>Cancelar</button>
          </div>
        </form>
      ) : (
        <button type="button" className="secondary wide" onClick={() => setAdding(true)}>Adicionar exercício</button>
      )}

      {rest && (
        <RestTimer
          seconds={rest.seconds}
          total={rest.total}
          nextLabel={rest.nextLabel}
          onAdjust={adjustRest}
          onSkip={skipRest}
        />
      )}
    </div>
  )
}

function targetLine(exercise) {
  const count = exercise.sets.length
  const load = formatLoad(exercise.targetLoad)
  const series = count === 1 ? '1 série' : `${count} séries`
  const rir = exercise.targetRir != null ? ` RIR ${exercise.targetRir}.` : ''
  return `${series} de ${exercise.targetReps} reps${load ? ` com ${load}` : ''}.${rir} Descanso ${formatRest(exercise.restSeconds)}.`
}

function Nudge({ label, value, step, onChange, onStep }) {
  return (
    <div className="nudge">
      <button type="button" aria-label={`Diminuir ${label}`} onClick={() => onStep(-step)}>−</button>
      <input aria-label={label} inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} />
      <button type="button" aria-label={`Aumentar ${label}`} onClick={() => onStep(step)}>+</button>
    </div>
  )
}
