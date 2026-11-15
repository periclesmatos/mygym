import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { bestSet, formatDay, formatDuration, formatLoad, formatSet, formatTime, formatVolume, plural, sessionTotals } from '../format'
import { useFeedback } from '../ui/feedbackContext'
import { useAsync } from '../ui/hooks'
import { Icon, IconButton } from '../ui/Icon'
import { PageHeader } from '../ui/PageHeader'
import { Action, ActionList, Sheet } from '../ui/Sheet'
import { ErrorState, Skeleton } from '../ui/States'

export function HistoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast, confirm } = useFeedback()
  const [menu, setMenu] = useState(false)
  const [busy, setBusy] = useState(false)
  const { data: session, error, loading, reload } = useAsync(() => api.session(id), [id])
  const celebration = location.state?.justFinished ? location.state : null

  if (error) return <><PageHeader back="/historico" title="Treino" /><ErrorState message={error} onRetry={reload} /></>
  if (loading && !session) return <><PageHeader back="/historico" title="Treino" /><Skeleton lines={2} /><Skeleton lines={4} /></>
  if (!session.finishedAt) return <Navigate to={`/treino/${session.id}`} replace />

  const { done, volume, duration } = sessionTotals(session)

  async function repeat() {
    setMenu(false)
    setBusy(true)
    try {
      const exercises = session.exercises
        .filter((exercise) => exercise.sets.length > 0)
        .map((exercise) => ({
          name: exercise.name,
          plannedSets: Math.min(20, exercise.sets.length),
          reps: exercise.targetReps,
          load: bestSet(exercise)?.load || exercise.targetLoad,
          restSeconds: exercise.restSeconds,
          rir: exercise.targetRir
        }))
      const created = await api.createSession({ name: session.name, exercises })
      navigate(`/treino/${created.id}`)
    } catch (caught) {
      toast(caught.message, 'error')
      setBusy(false)
    }
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
    try {
      await api.deleteSession(session.id)
      toast('Treino apagado.')
      navigate('/historico', { replace: true })
    } catch (caught) {
      toast(caught.message, 'error')
    }
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
          <span className="hero-icon"><Icon name="trophy" size={26} /></span>
          <h2>Treino concluído!</h2>
          {celebration.highlights?.length > 0 ? (
            <>
              <p className="muted">Você superou a última vez em {plural(celebration.highlights.length, 'exercício', 'exercícios')}:</p>
              <ul className="highlights">
                {celebration.highlights.map((item) => (
                  <li key={item.name}>
                    <Icon name="up" size={16} strokeWidth={3} />
                    <span><strong>{item.name}</strong> {item.now} <span className="muted">(antes {item.before})</span></span>
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
        <div className="stat"><Icon name="timer" size={20} /><strong>{duration ? formatDuration(duration) : '—'}</strong><span>duração</span></div>
        <div className="stat"><Icon name="check" size={20} /><strong>{done}</strong><span>{done === 1 ? 'série feita' : 'séries feitas'}</span></div>
        <div className="stat"><Icon name="dumbbell" size={20} /><strong>{formatVolume(volume) || '—'}</strong><span>volume</span></div>
      </section>

      {session.exercises.map((exercise) => {
        const doneSets = exercise.sets.filter((set) => set.completedAt)
        return (
          <section className="card" key={exercise.id}>
            <header className="exercise-head">
              <div>
                <h2>{exercise.name}</h2>
                <p className="muted small">
                  Meta {exercise.targetReps} reps{formatLoad(exercise.targetLoad) ? ` · ${formatLoad(exercise.targetLoad)}` : ''}
                  {exercise.targetRir != null ? ` · RIR ${exercise.targetRir}` : ''}
                </p>
              </div>
              <Link className="icon-btn" to={`/evolucao/exercicio?nome=${encodeURIComponent(exercise.name)}`} aria-label={`Evolução de ${exercise.name}`} title="Ver evolução">
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
                    <span className="tabular">{set.completedAt ? formatSet(set.load, set.reps) : 'não feita'}</span>
                    {set.completedAt && set.rir != null && <span className="muted small">RIR {set.rir}</span>}
                  </li>
                ))}
              </ol>
            )}
            {doneSets.length === 0 && exercise.sets.length > 0 && <p className="muted small">Nenhuma série marcada como feita.</p>}
          </section>
        )
      })}

      <button type="button" className="btn btn-secondary btn-block" disabled={busy} onClick={repeat}>
        <Icon name="repeat" size={20} />{busy ? 'Começando…' : 'Repetir este treino'}
      </button>

      <Sheet open={menu} onClose={() => setMenu(false)} title={session.name}>
        <ActionList>
          <Action icon={<Icon name="repeat" />} label="Repetir este treino" hint="Começa um treino avulso igual a este" onClick={repeat} disabled={busy} />
          <Action icon={<Icon name="trash" />} label="Apagar do histórico" danger onClick={remove} />
        </ActionList>
      </Sheet>
    </>
  )
}
