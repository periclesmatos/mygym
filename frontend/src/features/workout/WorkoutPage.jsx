import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ExercisePicker } from '@/features/routine/components/ExercisePicker'
import { exercisePayload } from '@/features/routine/lib/exerciseModel'
import { ExerciseCard } from '@/features/workout/components/ExerciseCard'
import { RestBar } from '@/features/workout/components/RestBar'
import { useBeep } from '@/features/workout/hooks/useBeep'
import { useRestTimer } from '@/features/workout/hooks/useRestTimer'
import { useWorkoutSession } from '@/features/workout/hooks/useWorkoutSession'
import { writeRest } from '@/features/workout/lib/restStorage'
import { findSet, highlights, nextOpenSet, previousSet } from '@/features/workout/lib/session'
import { sessionsApi } from '@/shared/api/sessions'
import { useAction } from '@/shared/hooks/useAction'
import { useNow } from '@/shared/hooks/useNow'
import { useWakeLock } from '@/shared/hooks/useWakeLock'
import { formatClock } from '@/shared/lib/date'
import { vibrate } from '@/shared/lib/device'
import { numberOrNull } from '@/shared/lib/number'
import { plural } from '@/shared/lib/text'
import { firstReps, sessionTotals } from '@/shared/lib/training'
import { Stepper } from '@/shared/ui/Fields'
import { Icon, IconButton } from '@/shared/ui/Icon'
import { Action, ActionList, Sheet } from '@/shared/ui/Sheet'
import { Empty, ErrorState, Skeleton } from '@/shared/ui/States'
import { useFeedback } from '@/shared/ui/feedbackContext'

export function WorkoutPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast, confirm } = useFeedback()
  const runAction = useAction()
  const workout = useWorkoutSession(id, {
    onError: (message) => toast(message, 'error'),
    onAlreadyFinished: (data) => navigate(`/historico/${data.id}`, { replace: true })
  })
  const { sessionId, session, sessionRef, drafts, draftsRef, last } = workout
  const [exerciseMenu, setExerciseMenu] = useState(null)
  const [setSheet, setSetSheet] = useState(null)
  const [adding, setAdding] = useState(false)
  const [menu, setMenu] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const now = useNow(1000, Boolean(session))
  const { prime, beep } = useBeep()
  const rest = useRestTimer(sessionId, now, () => {
    vibrate([180, 90, 180])
    beep()
    toast('Descanso encerrado. Próxima série!')
  })
  useWakeLock(Boolean(session))

  /** Roda uma ação que devolve a sessão atualizada. */
  function run(action, success) {
    return runAction(async () => {
      workout.applySession(await action())
      if (success) toast(success)
    })
  }

  function startRest(exercise, setId) {
    const next = nextOpenSet(sessionRef.current, setId)
    if (!next || exercise.restSeconds <= 0) {
      rest.clear()
      return
    }
    rest.start(exercise.restSeconds, `A seguir: ${next.exercise.name} · série ${next.set.position}`)
  }

  /** Marca ou desmarca a série. Ao marcar, completa campos vazios com a série anterior ou a última vez. */
  async function toggle(exercise, set) {
    const completing = !set.completedAt
    if (completing) {
      const draft = draftsRef.current[set.id]
      const before = exercise.sets.find((item) => item.position === set.position - 1 && item.completedAt)
      const beforeDraft = before ? draftsRef.current[before.id] : null
      const previous = previousSet(last, exercise, set)
      const fill = {}
      if (draft.reps === '') {
        fill.reps =
          beforeDraft?.reps || (previous?.reps != null ? String(previous.reps) : firstReps(exercise.targetReps))
      }
      if (draft.load === '') {
        const load = beforeDraft?.load || (previous?.load != null ? String(Number(previous.load)) : '')
        if (load) fill.load = load
      }
      if (Object.keys(fill).length) workout.setDraft(set.id, fill)
      if (numberOrNull(draftsRef.current[set.id].reps) == null) {
        toast('Informe quantas repetições você fez.', 'error')
        return
      }
      prime()
      vibrate(15)
    }
    workout.patchSet(set.id, { completedAt: completing ? new Date().toISOString() : null })
    if (completing) startRest(exercise, set.id)
    const updated = await workout.persist(set.id, completing)
    if (!updated) workout.patchSet(set.id, { completedAt: set.completedAt })
  }

  function copyPrevious(exercise, set) {
    const previous = previousSet(last, exercise, set)
    if (!previous) return
    const reps = previous.reps == null ? '' : String(previous.reps)
    workout.setDraft(set.id, { reps, load: previous.load == null ? '' : String(Number(previous.load)) })
    workout.changeDraft(set.id, 'reps', reps)
  }

  async function addSet(exercise) {
    setExerciseMenu(null)
    await workout.flushAll()
    run(() => sessionsApi.addSet(sessionId, exercise.id))
  }

  function removeSet(set) {
    setSetSheet(null)
    workout.cancelPending([set.id])
    run(() => sessionsApi.removeSet(sessionId, set.id), 'Série removida.')
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
    workout.cancelPending(exercise.sets.map((set) => set.id))
    run(() => sessionsApi.removeExercise(sessionId, exercise.id), 'Exercício removido.')
  }

  /** Adiciona em sequência; se um falhar, os anteriores ficam e a folha continua aberta. */
  async function addExercises(drafts) {
    const ok = await runAction(async () => {
      for (const draft of drafts) {
        workout.applySession(await sessionsApi.addExercise(sessionId, exercisePayload(draft)))
      }
    })
    if (!ok) return
    toast(
      drafts.length === 1
        ? `${drafts[0].name} adicionado.`
        : `${plural(drafts.length, 'exercício adicionado', 'exercícios adicionados')}.`
    )
    setAdding(false)
    workout.loadLast(drafts.map((draft) => draft.name))
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
    if (ok) discardNow()
  }

  async function discardNow() {
    workout.cancelAllPending()
    await runAction(async () => {
      await sessionsApi.remove(sessionId)
      writeRest(null)
      toast('Treino descartado.')
      navigate('/', { replace: true })
    })
  }

  async function finish() {
    await workout.flushAll()
    const { done, total } = sessionTotals(sessionRef.current)
    if (done === 0) {
      const ok = await confirm({
        title: 'Nenhuma série marcada',
        message:
          'Marque cada série com ✓ quando terminar. Sem séries feitas, não há o que salvar. Quer descartar este treino?',
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
    await runAction(
      async () => {
        const updated = await sessionsApi.finish(sessionId)
        writeRest(null)
        navigate(`/historico/${updated.id}`, {
          replace: true,
          state: { justFinished: true, highlights: highlights(updated, last) }
        })
      },
      () => {
        setFinishing(false)
      }
    )
  }

  if (workout.loadError) return <ErrorState message={workout.loadError} onRetry={() => window.location.reload()} />
  if (!session)
    return (
      <>
        <Skeleton lines={2} />
        <Skeleton lines={5} />
        <Skeleton lines={5} />
      </>
    )

  const { done, total } = sessionTotals(session)
  const elapsed = (now - new Date(session.startedAt).getTime()) / 1000
  const allDone = total > 0 && done === total
  const menuSet = setSheet ? findSet(session, setSheet.setId) : null

  return (
    <div className={rest.rest ? 'workout has-rest' : 'workout'}>
      <header className="workout-head">
        <IconButton icon="back" label="Voltar ao início" onClick={() => navigate('/')} />
        <div className="workout-title">
          <h1>{session.name}</h1>
          <p>
            <span className="tabular">{formatClock(elapsed)}</span> · {done}/{total} séries
          </p>
        </div>
        <IconButton icon="more" label="Opções do treino" onClick={() => setMenu(true)} />
        <button type="button" className="btn btn-primary btn-sm" onClick={finish} disabled={finishing}>
          {finishing ? 'Salvando…' : 'Concluir'}
        </button>
        <div className="progress thin" aria-hidden="true">
          <span style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </header>

      {session.exercises.length === 0 && (
        <Empty icon="dumbbell" title="Treino vazio" text="Adicione o primeiro exercício para começar a registrar." />
      )}

      {session.exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          drafts={drafts}
          last={last}
          onMenu={() => setExerciseMenu(exercise)}
          onSetOptions={(set) => setSetSheet({ setId: set.id, exercise })}
          onCopyPrevious={(set) => copyPrevious(exercise, set)}
          onChange={workout.changeDraft}
          onToggle={(set) => toggle(exercise, set)}
          onAddSet={() => addSet(exercise)}
        />
      ))}

      <button type="button" className="btn btn-secondary btn-block" onClick={() => setAdding(true)}>
        <Icon name="plus" size={20} />
        Adicionar exercício
      </button>

      {allDone && (
        <button
          type="button"
          className="btn btn-primary btn-lg btn-block finish-cta"
          onClick={finish}
          disabled={finishing}
        >
          <Icon name="check" size={20} strokeWidth={3} />
          Concluir treino
        </button>
      )}

      {rest.rest && (
        <RestBar
          remaining={rest.remaining}
          total={rest.rest.total}
          label={rest.rest.label}
          onAdjust={rest.adjust}
          onSkip={rest.skip}
        />
      )}

      <Sheet open={menu} onClose={() => setMenu(false)} title={session.name}>
        <ActionList>
          <Action
            icon={<Icon name="check" />}
            label="Concluir treino"
            onClick={() => {
              setMenu(false)
              finish()
            }}
          />
          <Action
            icon={<Icon name="trash" />}
            label="Descartar treino"
            hint="Apaga o treino e as séries"
            danger
            onClick={discard}
          />
        </ActionList>
      </Sheet>

      <Sheet open={!!exerciseMenu} onClose={() => setExerciseMenu(null)} title={exerciseMenu?.name}>
        {exerciseMenu && (
          <ActionList>
            <Action icon={<Icon name="plus" />} label="Adicionar série" onClick={() => addSet(exerciseMenu)} />
            <Action
              icon={<Icon name="chart" />}
              label="Ver evolução"
              onClick={() => navigate(`/evolucao/exercicio?nome=${encodeURIComponent(exerciseMenu.name)}`)}
            />
            <Action
              icon={<Icon name="trash" />}
              label="Remover exercício"
              danger
              onClick={() => removeExercise(exerciseMenu)}
            />
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
              onChange={(value) => workout.changeDraft(menuSet.id, 'rir', value)}
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

      <ExercisePicker
        open={adding}
        title="Adicionar ao treino"
        onClose={() => setAdding(false)}
        onAdd={addExercises}
        excluded={session.exercises.map((exercise) => exercise.name)}
      />
    </div>
  )
}
