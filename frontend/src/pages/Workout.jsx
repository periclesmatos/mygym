import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, exerciseKey } from '../api'
import { ExerciseSheet } from '../components/ExerciseForm'
import { RestBar } from '../components/RestBar'
import {
  bestSet, emptyExercise, estimatedMax, exercisePayload, firstReps, formatClock, formatLoad, formatNumber,
  formatRest, formatSet, numberOrNull, plural, relativeDay, sessionTotals
} from '../format'
import { useFeedback } from '../ui/Feedback'
import { Stepper } from '../ui/Fields'
import { useNow } from '../ui/hooks'
import { Icon, IconButton } from '../ui/Icon'
import { Action, ActionList, Sheet } from '../ui/Sheet'
import { Empty, ErrorState, Skeleton } from '../ui/States'

const REST_KEY = 'appgym_rest'

function readRest(sessionId) {
  try {
    const rest = JSON.parse(localStorage.getItem(REST_KEY))
    if (rest && rest.sessionId === sessionId && rest.endsAt > Date.now()) return rest
  } catch { /* sem armazenamento */ }
  return null
}

function writeRest(rest) {
  try {
    if (rest) localStorage.setItem(REST_KEY, JSON.stringify(rest))
    else localStorage.removeItem(REST_KEY)
  } catch { /* sem armazenamento */ }
}

function draftFrom(set) {
  return {
    reps: set.reps == null ? '' : String(set.reps),
    load: set.load == null ? '' : String(Number(set.load)),
    rir: set.rir == null ? '' : String(set.rir)
  }
}

function findSet(session, setId) {
  for (const exercise of session?.exercises || []) {
    for (const set of exercise.sets) if (set.id === setId) return set
  }
  return null
}

function nextOpenSet(session, afterSetId) {
  const items = []
  for (const exercise of session.exercises) for (const set of exercise.sets) items.push({ exercise, set })
  const start = items.findIndex((item) => item.set.id === afterSetId)
  const ordered = [...items.slice(start + 1), ...items.slice(0, Math.max(0, start))]
  return ordered.find((item) => !item.set.completedAt) || null
}

/** Exercícios em que você foi melhor que da última vez, para a tela de conclusão. */
function highlights(session, last) {
  const result = []
  for (const exercise of session.exercises) {
    const best = bestSet(exercise)
    if (!best) continue
    const previous = last[exerciseKey(exercise.name)]
    if (!previous) continue
    const now = estimatedMax(best.load, best.reps)
    // Compara pelos valores brutos: o estimatedMax do servidor vem arredondado.
    const before = estimatedMax(previous.topLoad, previous.topReps)
    const improved = now > 0 && before > 0
      ? now > before + 0.05
      : !best.load && !Number(previous.topLoad) && best.reps > (previous.topReps || 0)
    if (improved) {
      result.push({ name: exercise.name, now: formatSet(best.load, best.reps), before: formatSet(previous.topLoad, previous.topReps) })
    }
  }
  return result
}

function useWakeLock(enabled) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return undefined
    let lock = null
    let cancelled = false
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
      } catch { /* o navegador pode recusar */ }
      if (cancelled) lock?.release().catch(() => {})
    }
    const onVisible = () => { if (document.visibilityState === 'visible') acquire() }
    acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => {})
    }
  }, [enabled])
}

export function Workout() {
  const { id } = useParams()
  const sessionId = Number(id)
  const navigate = useNavigate()
  const { toast, confirm } = useFeedback()
  const [session, setSession] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [drafts, setDrafts] = useState({})
  const [last, setLast] = useState({})
  const [rest, setRest] = useState(() => readRest(sessionId))
  const [exerciseMenu, setExerciseMenu] = useState(null)
  const [setSheet, setSetSheet] = useState(null)
  const [adding, setAdding] = useState(null)
  const [menu, setMenu] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const sessionRef = useRef(null)
  const draftsRef = useRef({})
  const timers = useRef({})
  const audio = useRef(null)
  const alerted = useRef(0)
  const now = useNow(1000, Boolean(session))
  useWakeLock(Boolean(session))

  const applySession = useCallback((data) => {
    sessionRef.current = data
    setSession(data)
    const next = { ...draftsRef.current }
    const ids = new Set()
    for (const exercise of data.exercises) {
      for (const set of exercise.sets) {
        ids.add(String(set.id))
        if (!next[set.id]) next[set.id] = draftFrom(set)
      }
    }
    for (const key of Object.keys(next)) if (!ids.has(key)) delete next[key]
    draftsRef.current = next
    setDrafts(next)
  }, [])

  function patchSet(setId, patch) {
    const current = sessionRef.current
    const next = {
      ...current,
      exercises: current.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set))
      }))
    }
    sessionRef.current = next
    setSession(next)
  }

  function setDraft(setId, patch) {
    const next = { ...draftsRef.current, [setId]: { ...draftsRef.current[setId], ...patch } }
    draftsRef.current = next
    setDrafts(next)
  }

  async function persist(setId, completed) {
    clearTimeout(timers.current[setId])
    delete timers.current[setId]
    const draft = draftsRef.current[setId]
    if (!draft) return null
    const reps = numberOrNull(draft.reps)
    const load = numberOrNull(draft.load)
    const rir = numberOrNull(draft.rir)
    if (reps != null && (!Number.isInteger(reps) || reps < 0 || reps > 999)) { toast('Repetições inválidas.', 'error'); return null }
    if (load != null && (load < 0 || load > 9999.99)) { toast('Carga inválida.', 'error'); return null }
    if (rir != null && (!Number.isInteger(rir) || rir < 0 || rir > 10)) { toast('RIR deve ficar entre 0 e 10.', 'error'); return null }
    try {
      const updated = await api.updateSet(sessionId, setId, { reps, load, rir, completed })
      const fresh = findSet(updated, setId)
      if (fresh && sessionRef.current) patchSet(setId, { completedAt: fresh.completedAt, reps: fresh.reps, load: fresh.load, rir: fresh.rir })
      return updated
    } catch (caught) {
      toast(caught.message, 'error')
      return null
    }
  }

  function flushAll() {
    return Promise.all(Object.keys(timers.current).map((key) => {
      const setId = Number(key)
      return persist(setId, Boolean(findSet(sessionRef.current, setId)?.completedAt))
    }))
  }

  useEffect(() => {
    let active = true
    api.session(id).then((data) => {
      if (!active) return
      if (data.finishedAt) { navigate(`/historico/${data.id}`, { replace: true }); return }
      applySession(data)
      api.lastPerformance(data.exercises.map((exercise) => exercise.name))
        .then((map) => { if (active) setLast(map) })
        .catch(() => {})
    }).catch((caught) => { if (active) setLoadError(caught.message) })
    return () => {
      active = false
      // Salva o que ainda estava aguardando o atraso de digitação.
      flushAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Fim do descanso: vibra, apita e some.
  const remaining = rest ? Math.min(rest.total, Math.max(0, Math.ceil((rest.endsAt - now) / 1000))) : 0
  useEffect(() => {
    if (!rest || rest.endsAt > now || alerted.current === rest.endsAt) return
    alerted.current = rest.endsAt
    try { navigator.vibrate?.([180, 90, 180]) } catch { /* sem vibração */ }
    beep()
    setRest(null)
    writeRest(null)
    toast('Descanso encerrado. Próxima série!')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, rest])

  function ensureAudio() {
    try {
      if (!audio.current) {
        const Context = window.AudioContext || window.webkitAudioContext
        if (Context) audio.current = new Context()
      }
      audio.current?.resume?.()
    } catch { /* sem áudio */ }
  }

  function beep() {
    const context = audio.current
    if (!context) return
    try {
      for (const offset of [0, 0.22]) {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        const start = context.currentTime + offset
        oscillator.frequency.value = 880
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16)
        oscillator.connect(gain).connect(context.destination)
        oscillator.start(start)
        oscillator.stop(start + 0.18)
      }
    } catch { /* sem áudio */ }
  }

  function startRest(exercise, setId) {
    const next = nextOpenSet(sessionRef.current, setId)
    if (!next || exercise.restSeconds <= 0) {
      setRest(null)
      writeRest(null)
      return
    }
    const value = {
      sessionId,
      endsAt: Date.now() + exercise.restSeconds * 1000,
      total: exercise.restSeconds,
      label: `A seguir: ${next.exercise.name} · série ${next.set.position}`
    }
    setRest(value)
    writeRest(value)
  }

  function adjustRest(delta) {
    if (!rest) return
    const endsAt = Math.max(Date.now(), rest.endsAt + delta * 1000)
    const left = Math.ceil((endsAt - Date.now()) / 1000)
    if (left <= 0) { skipRest(); return }
    const value = { ...rest, endsAt, total: Math.max(rest.total, left) }
    setRest(value)
    writeRest(value)
  }

  function skipRest() {
    if (rest) alerted.current = rest.endsAt
    setRest(null)
    writeRest(null)
  }

  function previousFor(exercise, set) {
    return last[exerciseKey(exercise.name)]?.sets.find((item) => item.position === set.position) || null
  }

  function changeDraft(setId, field, value) {
    setDraft(setId, { [field]: value })
    clearTimeout(timers.current[setId])
    timers.current[setId] = setTimeout(() => {
      persist(setId, Boolean(findSet(sessionRef.current, setId)?.completedAt))
    }, 700)
  }

  async function toggle(exercise, set) {
    const completing = !set.completedAt
    if (completing) {
      const draft = draftsRef.current[set.id]
      const before = exercise.sets.find((item) => item.position === set.position - 1 && item.completedAt)
      const beforeDraft = before ? draftsRef.current[before.id] : null
      const previous = previousFor(exercise, set)
      const fill = {}
      if (draft.reps === '') {
        fill.reps = beforeDraft?.reps || (previous?.reps != null ? String(previous.reps) : firstReps(exercise.targetReps))
      }
      if (draft.load === '') {
        const load = beforeDraft?.load || (previous?.load != null ? String(Number(previous.load)) : '')
        if (load) fill.load = load
      }
      if (Object.keys(fill).length) setDraft(set.id, fill)
      if (numberOrNull(draftsRef.current[set.id].reps) == null) {
        toast('Informe quantas repetições você fez.', 'error')
        return
      }
      ensureAudio()
      try { navigator.vibrate?.(15) } catch { /* sem vibração */ }
    }
    patchSet(set.id, { completedAt: completing ? new Date().toISOString() : null })
    if (completing) startRest(exercise, set.id)
    const updated = await persist(set.id, completing)
    if (!updated) patchSet(set.id, { completedAt: set.completedAt })
  }

  function copyPrevious(exercise, set) {
    const previous = previousFor(exercise, set)
    if (!previous) return
    setDraft(set.id, {
      reps: previous.reps == null ? '' : String(previous.reps),
      load: previous.load == null ? '' : String(Number(previous.load))
    })
    changeDraft(set.id, 'reps', previous.reps == null ? '' : String(previous.reps))
  }

  async function run(action, success) {
    try {
      applySession(await action())
      if (success) toast(success)
      return true
    } catch (caught) {
      toast(caught.message, 'error')
      return false
    }
  }

  async function addSet(exercise) {
    setExerciseMenu(null)
    await flushAll()
    run(() => api.addSet(sessionId, exercise.id))
  }

  async function removeSet(set) {
    setSetSheet(null)
    clearTimeout(timers.current[set.id])
    delete timers.current[set.id]
    run(() => api.removeSet(sessionId, set.id), 'Série removida.')
  }

  async function removeExercise(exercise) {
    setExerciseMenu(null)
    if (exercise.sets.some((set) => set.completedAt)) {
      const ok = await confirm({
        title: `Remover ${exercise.name}?`,
        message: 'As séries já feitas deste exercício também saem do treino.',
        confirmLabel: 'Remover',
        danger: true
      })
      if (!ok) return
    }
    for (const set of exercise.sets) { clearTimeout(timers.current[set.id]); delete timers.current[set.id] }
    run(() => api.removeExercise(sessionId, exercise.id), 'Exercício removido.')
  }

  async function addExercise(draft) {
    const ok = await run(() => api.addExercise(sessionId, exercisePayload(draft)), `${draft.name.trim()} adicionado.`)
    if (!ok) return
    setAdding(null)
    api.lastPerformance([draft.name]).then((map) => setLast((current) => ({ ...current, ...map }))).catch(() => {})
    requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }))
  }

  async function discard() {
    setMenu(false)
    const ok = await confirm({
      title: 'Descartar treino?',
      message: 'O treino e todas as séries registradas serão apagados. Não dá para desfazer.',
      confirmLabel: 'Descartar',
      danger: true
    })
    if (!ok) return
    discardNow()
  }

  async function discardNow() {
    for (const key of Object.keys(timers.current)) clearTimeout(timers.current[key])
    timers.current = {}
    try {
      await api.deleteSession(sessionId)
      writeRest(null)
      toast('Treino descartado.')
      navigate('/', { replace: true })
    } catch (caught) {
      toast(caught.message, 'error')
    }
  }

  async function finish() {
    await flushAll()
    const { done, total } = sessionTotals(sessionRef.current)
    if (done === 0) {
      const ok = await confirm({
        title: 'Nenhuma série marcada',
        message: 'Marque cada série com ✓ quando terminar. Sem séries feitas, não há o que salvar. Quer descartar este treino?',
        confirmLabel: 'Descartar treino',
        cancelLabel: 'Voltar ao treino',
        danger: true
      })
      if (ok) discardNow()
      return
    }
    if (done < total) {
      const missing = total - done
      const ok = await confirm({
        title: 'Concluir treino?',
        message: `${plural(missing, 'série ficou', 'séries ficaram')} sem marcar e não ${missing === 1 ? 'entra' : 'entram'} no histórico.`,
        confirmLabel: 'Concluir',
        cancelLabel: 'Voltar ao treino'
      })
      if (!ok) return
    }
    setFinishing(true)
    try {
      const updated = await api.finish(sessionId)
      writeRest(null)
      navigate(`/historico/${updated.id}`, {
        replace: true,
        state: { justFinished: true, highlights: highlights(updated, last) }
      })
    } catch (caught) {
      toast(caught.message, 'error')
      setFinishing(false)
    }
  }

  if (loadError) return <ErrorState message={loadError} onRetry={() => window.location.reload()} />
  if (!session) return <><Skeleton lines={2} /><Skeleton lines={5} /><Skeleton lines={5} /></>

  const { done, total } = sessionTotals(session)
  const elapsed = (now - new Date(session.startedAt).getTime()) / 1000
  const allDone = total > 0 && done === total
  const menuSet = setSheet ? findSet(session, setSheet.setId) : null

  return (
    <div className={rest ? 'workout has-rest' : 'workout'}>
      <header className="workout-head">
        <IconButton icon="back" label="Voltar ao início" onClick={() => navigate('/')} />
        <div className="workout-title">
          <h1>{session.name}</h1>
          <p><span className="tabular">{formatClock(elapsed)}</span> · {done}/{total} séries</p>
        </div>
        <IconButton icon="more" label="Opções do treino" onClick={() => setMenu(true)} />
        <button type="button" className="btn btn-primary btn-sm" onClick={finish} disabled={finishing}>
          {finishing ? 'Salvando…' : 'Concluir'}
        </button>
        <div className="progress thin" aria-hidden="true"><span style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
      </header>

      {session.exercises.length === 0 && (
        <Empty icon="dumbbell" title="Treino vazio" text="Adicione o primeiro exercício para começar a registrar." />
      )}

      {session.exercises.map((exercise) => {
        const finished = exercise.sets.filter((set) => set.completedAt).length
        const complete = exercise.sets.length > 0 && finished === exercise.sets.length
        const previous = last[exerciseKey(exercise.name)]
        const target = [
          `${exercise.targetReps} reps`,
          formatLoad(exercise.targetLoad),
          exercise.targetRir != null ? `RIR ${exercise.targetRir}` : null,
          exercise.restSeconds > 0 ? `descanso ${formatRest(exercise.restSeconds)}` : null
        ].filter(Boolean).join(' · ')
        return (
          <section key={exercise.id} className={complete ? 'card exercise complete' : 'card exercise'}>
            <header className="exercise-head">
              <div>
                <h2>
                  {complete && <Icon name="check" size={18} strokeWidth={3} className="ok-text" />}
                  {exercise.name}
                </h2>
                <p className="muted small">Meta: {target}</p>
              </div>
              <IconButton icon="more" label={`Opções de ${exercise.name}`} onClick={() => setExerciseMenu(exercise)} />
            </header>
            {previous && (
              <p className="last-line">
                <Icon name="history" size={15} />
                <span>{relativeDay(previous.date)}: {previous.sets.map((item) => formatSet(item.load, item.reps)).join(' · ')}</span>
              </p>
            )}

            {exercise.sets.length > 0 && (
              <div className="sets" role="table" aria-label={`Séries de ${exercise.name}`}>
                <div className="set-row head" role="row">
                  <span role="columnheader">Série</span>
                  <span role="columnheader">Anterior</span>
                  <span role="columnheader">kg</span>
                  <span role="columnheader">Reps</span>
                  <span role="columnheader" className="sr-only">Feita</span>
                </div>
                {exercise.sets.map((set) => {
                  const draft = drafts[set.id] || draftFrom(set)
                  const prior = previousFor(exercise, set)
                  const isDone = Boolean(set.completedAt)
                  return (
                    <div key={set.id} className={isDone ? 'set-row done' : 'set-row'} role="row">
                      <button type="button" className="set-num" onClick={() => setSetSheet({ setId: set.id, exercise })} aria-label={`Opções da série ${set.position}`}>
                        {set.position}
                      </button>
                      <button
                        type="button"
                        className="set-prev"
                        disabled={!prior || isDone}
                        onClick={() => copyPrevious(exercise, set)}
                        aria-label={prior ? `Repetir ${formatSet(prior.load, prior.reps)}` : 'Sem registro anterior'}
                      >
                        {prior ? formatSet(prior.load, prior.reps) : '—'}
                      </button>
                      <input
                        className="set-input"
                        inputMode="decimal"
                        enterKeyHint="next"
                        aria-label={`Carga da série ${set.position}, em kg`}
                        placeholder={prior?.load != null ? formatNumber(prior.load) : '—'}
                        value={draft.load}
                        onChange={(event) => changeDraft(set.id, 'load', event.target.value)}
                        onFocus={(event) => event.target.select()}
                      />
                      <input
                        className="set-input"
                        inputMode="numeric"
                        enterKeyHint="done"
                        aria-label={`Repetições da série ${set.position}`}
                        placeholder={prior?.reps != null ? String(prior.reps) : (firstReps(exercise.targetReps) || '—')}
                        value={draft.reps}
                        onChange={(event) => changeDraft(set.id, 'reps', event.target.value)}
                        onFocus={(event) => event.target.select()}
                      />
                      <button
                        type="button"
                        className={isDone ? 'set-check on' : 'set-check'}
                        aria-pressed={isDone}
                        aria-label={isDone ? `Desmarcar série ${set.position}` : `Marcar série ${set.position} como feita`}
                        onClick={() => toggle(exercise, set)}
                      >
                        <Icon name="check" size={20} strokeWidth={3} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <button type="button" className="btn btn-quiet btn-sm btn-block" onClick={() => addSet(exercise)}>
              <Icon name="plus" size={18} />Adicionar série
            </button>
          </section>
        )
      })}

      <button type="button" className="btn btn-secondary btn-block" onClick={() => setAdding(emptyExercise())}>
        <Icon name="plus" size={20} />Adicionar exercício
      </button>

      {allDone && (
        <button type="button" className="btn btn-primary btn-lg btn-block finish-cta" onClick={finish} disabled={finishing}>
          <Icon name="check" size={20} strokeWidth={3} />Concluir treino
        </button>
      )}

      {rest && <RestBar remaining={remaining} total={rest.total} label={rest.label} onAdjust={adjustRest} onSkip={skipRest} />}

      <Sheet open={menu} onClose={() => setMenu(false)} title={session.name}>
        <ActionList>
          <Action icon={<Icon name="check" />} label="Concluir treino" onClick={() => { setMenu(false); finish() }} />
          <Action icon={<Icon name="trash" />} label="Descartar treino" hint="Apaga o treino e as séries" danger onClick={discard} />
        </ActionList>
      </Sheet>

      <Sheet open={!!exerciseMenu} onClose={() => setExerciseMenu(null)} title={exerciseMenu?.name}>
        {exerciseMenu && (
          <ActionList>
            <Action icon={<Icon name="plus" />} label="Adicionar série" onClick={() => addSet(exerciseMenu)} />
            <Action icon={<Icon name="chart" />} label="Ver evolução" onClick={() => navigate(`/evolucao/exercicio?nome=${encodeURIComponent(exerciseMenu.name)}`)} />
            <Action icon={<Icon name="trash" />} label="Remover exercício" danger onClick={() => removeExercise(exerciseMenu)} />
          </ActionList>
        )}
      </Sheet>

      <Sheet
        open={!!menuSet}
        onClose={() => setSetSheet(null)}
        title={menuSet ? `${setSheet.exercise.name} · série ${menuSet.position}` : ''}
      >
        {menuSet && (
          <div className="stack">
            <Stepper
              label="RIR (repetições que ainda sobravam)"
              value={drafts[menuSet.id]?.rir ?? ''}
              onChange={(value) => changeDraft(menuSet.id, 'rir', value)}
              min={0}
              max={10}
              inputMode="numeric"
              placeholder="—"
              allowEmpty
            />
            <ActionList>
              <Action icon={<Icon name="trash" />} label="Remover série" danger onClick={() => removeSet(menuSet)} />
            </ActionList>
          </div>
        )}
      </Sheet>

      <ExerciseSheet
        exercise={adding}
        isNew
        saveLabel="Adicionar ao treino"
        onClose={() => setAdding(null)}
        onSave={addExercise}
      />
    </div>
  )
}
