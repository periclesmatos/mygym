import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAction } from '@/shared/hooks/useAction'
import { useAsync } from '@/shared/hooks/useAsync'
import { CARDIO_GROUP, formatCardio, intensityLabel } from '@/shared/lib/cardio'
import { formatDay, formatDuration, formatTime } from '@/shared/lib/date'
import { plural } from '@/shared/lib/text'
import { bestSet, formatEntry, formatLoad, formatVolume, sessionTotals } from '@/shared/lib/training'
import { Icon, IconButton } from '@/shared/ui/Icon'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PeriodSheet } from '@/shared/ui/PeriodSheet'
import { Action, ActionList, Sheet } from '@/shared/ui/Sheet'
import { StatCard } from '@/shared/ui/StatCard'
import { ErrorState, Skeleton } from '@/shared/ui/States'
import { useFeedback } from '@/shared/ui/feedbackContext'
import { sessionsApi } from '@/shared/api/workout'

export function HistoryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast, confirm } = useFeedback()
  const runAction = useAction()
  const [menu, setMenu] = useState(false)
  const [busy, setBusy] = useState(false)
  const [adjusting, setAdjusting] = useState(false)
  const [saving, setSaving] = useState(false)
  const { data: session, error, loading, reload, setData } = useAsync(() => sessionsApi.get(id), [id])
  const celebration = location.state?.justFinished ? location.state : null

  if (error)
    return (
      <>
        <PageHeader back="/historico" title="Treino" />
        <ErrorState message={error} onRetry={reload} />
      </>
    )
  if (loading && !session)
    return (
      <>
        <PageHeader back="/historico" title="Treino" />
        <Skeleton lines={2} />
        <Skeleton lines={4} />
      </>
    )
  if (!session.finishedAt) return <Navigate to={`/treino/${session.id}`} replace />

  const { done, volume, duration, cardio } = sessionTotals(session)

  async function repeat() {
    setMenu(false)
    setBusy(true)
    await runAction(
      async () => {
        const exercises = session.exercises
          .filter((exercise) => exercise.sets.length > 0)
          .map((exercise) => ({
            name: exercise.name,
            plannedSets: Math.min(20, exercise.sets.length),
            reps: exercise.targetReps,
            load: exercise.cardio ? null : bestSet(exercise)?.load || exercise.targetLoad,
            muscleGroup: exercise.cardio ? CARDIO_GROUP : null,
            restSeconds: exercise.restSeconds,
            rir: exercise.targetRir
          }))
        const created = await sessionsApi.create({ name: session.name, exercises })
        navigate(`/treino/${created.id}`)
      },
      () => {
        setBusy(false)
      }
    )
  }

  async function adjust(period) {
    setSaving(true)
    const ok = await runAction(async () => {
      setData(await sessionsApi.changePeriod(session.id, period))
    })
    setSaving(false)
    if (!ok) return
    setAdjusting(false)
    toast('Horário ajustado.', 'success')
  }

  async function remove() {
    setMenu(false)
    const ok = await confirm({
      title: 'Apagar este treino?',
      message: 'Ele sai do histórico e da evolução dos exercícios. Não dá para desfazer.',
      confirmLabel: 'Apagar',
      danger: true
    })
    if (!ok) return
    await runAction(async () => {
      await sessionsApi.remove(session.id)
      toast('Treino apagado.')
      navigate('/historico', { replace: true })
    })
  }

  return (
    <>
      <PageHeader
        back={celebration ? '/' : '/historico'}
        title={session.name}
        subtitle={`${formatDay(session.finishedAt, { weekday: 'short', day: 'numeric', month: 'short' })} · ${formatTime(session.startedAt)}–${formatTime(session.finishedAt)}`}
        actions={<IconButton icon="more" label="Opções" onClick={() => setMenu(true)} />}
      />

      {celebration && (
        <section className="card celebrate">
          <span className="hero-icon">
            <Icon name="trophy" size={26} />
          </span>
          <h2>{session.backdated ? 'Treino registrado!' : 'Treino concluído!'}</h2>
          {celebration.highlights?.length > 0 ? (
            <>
              <p className="muted">
                Você superou a última vez em {plural(celebration.highlights.length, 'exercício', 'exercícios')}:
              </p>
              <ul className="highlights">
                {celebration.highlights.map((item) => (
                  <li key={item.name}>
                    <Icon name="up" size={16} strokeWidth={3} />
                    <span>
                      <strong>{item.name}</strong> {item.now} <span className="muted">(antes {item.before})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="muted">Mais um registrado. Consistência é o que traz resultado.</p>
          )}
        </section>
      )}

      <section className="stats">
        <StatCard icon="timer" value={duration ? formatDuration(duration) : '—'} label="duração" />
        <StatCard icon="check" value={done} label={done === 1 ? 'série feita' : 'séries feitas'} />
        {cardio > 0 && !volume ? (
          <StatCard icon="run" value={formatCardio(cardio)} label="de cardio" />
        ) : (
          <StatCard icon="dumbbell" value={formatVolume(volume) || '—'} label="volume" />
        )}
      </section>

      {session.exercises.map((exercise) => {
        const doneSets = exercise.sets.filter((set) => set.completedAt)
        return (
          <section className="card" key={exercise.id}>
            <header className="exercise-head">
              <div>
                <h2>{exercise.name}</h2>
                <p className="muted small">
                  Meta {exercise.targetReps}
                  {exercise.cardio ? '' : ' reps'}
                  {formatLoad(exercise.targetLoad) ? ` · ${formatLoad(exercise.targetLoad)}` : ''}
                  {exercise.targetRir != null ? ` · RIR ${exercise.targetRir}` : ''}
                </p>
              </div>
              <Link
                className="icon-btn"
                to={`/evolucao/exercicio?nome=${encodeURIComponent(exercise.name)}`}
                aria-label={`Evolução de ${exercise.name}`}
                title="Ver evolução"
              >
                <Icon name="chart" size={20} />
              </Link>
            </header>
            {exercise.sets.length === 0 ? (
              <p className="muted small">Sem séries.</p>
            ) : (
              <ol className="done-sets">
                {exercise.sets.map((set) => (
                  <li key={set.id} className={set.completedAt ? '' : 'skipped'}>
                    <span className="set-num static">{set.position}</span>
                    <span className="tabular">{set.completedAt ? formatEntry(set) : 'não feita'}</span>
                    {set.completedAt && exercise.cardio && (
                      <span className="muted small">{intensityLabel(set.intensity)}</span>
                    )}
                    {set.completedAt && set.rir != null && <span className="muted small">RIR {set.rir}</span>}
                  </li>
                ))}
              </ol>
            )}
            {doneSets.length === 0 && exercise.sets.length > 0 && (
              <p className="muted small">Nenhuma série marcada como feita.</p>
            )}
          </section>
        )
      })}

      <button type="button" className="btn btn-secondary btn-block" disabled={busy} onClick={repeat}>
        <Icon name="repeat" size={20} />
        {busy ? 'Começando…' : 'Repetir este treino'}
      </button>

      <Sheet open={menu} onClose={() => setMenu(false)} title={session.name}>
        <ActionList>
          <Action
            icon={<Icon name="repeat" />}
            label="Repetir este treino"
            hint="Começa um treino avulso igual a este"
            onClick={repeat}
            disabled={busy}
          />
          <Action
            icon={<Icon name="calendar" />}
            label="Ajustar data e horário"
            hint="As séries não mudam"
            onClick={() => {
              setMenu(false)
              setAdjusting(true)
            }}
          />
          <Action icon={<Icon name="trash" />} label="Apagar do histórico" danger onClick={remove} />
        </ActionList>
      </Sheet>

      <PeriodSheet
        open={adjusting}
        onClose={() => setAdjusting(false)}
        title="Ajustar data e horário"
        period={session}
        busy={saving}
        onSave={adjust}
      />
    </>
  )
}
