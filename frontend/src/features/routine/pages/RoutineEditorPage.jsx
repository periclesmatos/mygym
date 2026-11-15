import { useAction } from '@/shared/hooks/useAction'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ExerciseSheet } from '@/features/routine/components/ExerciseForm'
import { ExercisePicker } from '@/features/routine/components/ExercisePicker'
import {
  exerciseFromTemplate,
  exercisePayload,
  exerciseSummary,
  validateExercise
} from '@/features/routine/domain/exerciseModel'
import { exerciseGroup } from '@/features/catalog'
import { plural } from '@/shared/lib/text'
import { estimateMinutes } from '@/shared/lib/training'
import { useFeedback } from '@/shared/ui/feedbackContext'
import { Icon, IconButton } from '@/shared/ui/Icon'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Empty, ErrorState, Skeleton } from '@/shared/ui/States'
import { templatesApi } from '@/shared/api/routine'

export function RoutineEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast, confirm } = useFeedback()
  const runAction = useAction()
  const [loaded, setLoaded] = useState(!id)
  const [loadError, setLoadError] = useState('')
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [exercises, setExercises] = useState([])
  const [editing, setEditing] = useState(null)
  const [picking, setPicking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return undefined
    let active = true
    templatesApi
      .get(id)
      .then((template) => {
        if (!active) return
        setName(template.name)
        setNotes(template.notes || '')
        setShowNotes(Boolean(template.notes))
        setExercises(template.exercises.map(exerciseFromTemplate))
        setLoaded(true)
      })
      .catch((caught) => {
        if (active) setLoadError(caught.message)
      })
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (!dirty) return undefined
    const warn = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function change(update) {
    update()
    setDirty(true)
    setError('')
  }

  function move(index, delta) {
    const target = index + delta
    if (target < 0 || target >= exercises.length) return
    change(() =>
      setExercises((current) => {
        const next = current.slice()
        ;[next[index], next[target]] = [next[target], next[index]]
        return next
      })
    )
  }

  function saveExercise(draft) {
    change(() => setExercises((current) => current.map((item) => (item.key === draft.key ? draft : item))))
    setEditing(null)
  }

  function addExercises(drafts) {
    change(() => setExercises((current) => [...current, ...drafts]))
    setPicking(false)
    toast(
      drafts.length === 1
        ? `${drafts[0].name} adicionado. Toque nele para ajustar.`
        : `${plural(drafts.length, 'exercício adicionado', 'exercícios adicionados')}. Toque para ajustar.`,
      'success'
    )
  }

  function removeExercise() {
    const key = editing.exercise.key
    change(() => setExercises((current) => current.filter((item) => item.key !== key)))
    setEditing(null)
  }

  async function save() {
    if (!name.trim()) {
      setError('Dê um nome ao treino.')
      return
    }
    if (exercises.length === 0) {
      setError('Adicione pelo menos um exercício.')
      return
    }
    const invalid = exercises.map(validateExercise).find(Boolean)
    if (invalid) {
      setError(invalid)
      return
    }
    setBusy(true)
    const body = { name: name.trim(), notes: notes.trim(), exercises: exercises.map(exercisePayload) }
    try {
      if (id) await templatesApi.update(id, body)
      else await templatesApi.create(body)
      setDirty(false)
      toast(id ? 'Treino salvo.' : 'Treino criado.', 'success')
      navigate('/rotina', { replace: true })
    } catch (caught) {
      setError(caught.message)
      setBusy(false)
    }
  }

  async function removeTemplate() {
    const ok = await confirm({
      title: `Remover ${name || 'este treino'}?`,
      message: 'Ele sai da rotina. Os treinos já feitos continuam no histórico.',
      confirmLabel: 'Remover',
      danger: true
    })
    if (!ok) return
    await runAction(async () => {
      await templatesApi.remove(id)
      setDirty(false)
      toast('Treino removido.')
      navigate('/rotina', { replace: true })
    })
  }

  async function leave() {
    if (dirty) {
      const ok = await confirm({
        title: 'Sair sem salvar?',
        message: 'As mudanças neste treino serão perdidas.',
        confirmLabel: 'Sair sem salvar',
        cancelLabel: 'Continuar editando',
        danger: true
      })
      if (!ok) return
    }
    navigate('/rotina')
  }

  const title = id ? 'Editar treino' : 'Novo treino'

  if (loadError)
    return (
      <>
        <PageHeader back="/rotina" title={title} />
        <ErrorState message={loadError} />
      </>
    )
  if (!loaded)
    return (
      <>
        <PageHeader back="/rotina" title={title} />
        <Skeleton lines={2} />
        <Skeleton />
      </>
    )

  return (
    <div className="with-actionbar">
      <header className="page-header">
        <IconButton icon="back" label="Voltar" onClick={leave} className="back-btn" />
        <div className="page-header-text">
          <h1>{title}</h1>
        </div>
        {id && (
          <div className="page-header-actions">
            <IconButton icon="trash" label="Remover treino" onClick={removeTemplate} className="danger-text" />
          </div>
        )}
      </header>

      <div className="stack">
        <label className="field">
          <span className="field-label">Nome do treino</span>
          <input
            className="input input-lg"
            placeholder="Ex.: Peito e tríceps"
            value={name}
            maxLength={80}
            autoFocus={!id}
            onChange={(event) => change(() => setName(event.target.value))}
          />
        </label>

        {showNotes ? (
          <label className="field">
            <span className="field-label">Observações</span>
            <textarea
              className="input"
              rows={3}
              maxLength={2000}
              placeholder="Aquecimento, ajustes de máquina, lembretes…"
              value={notes}
              onChange={(event) => change(() => setNotes(event.target.value))}
            />
          </label>
        ) : (
          <button type="button" className="link-btn" onClick={() => setShowNotes(true)}>
            <Icon name="plus" size={18} />
            Adicionar observações
          </button>
        )}
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Exercícios</h2>
          {exercises.length > 0 && (
            <span className="muted small">
              {plural(exercises.length, 'exercício', 'exercícios')} · ~{estimateMinutes(exercises)} min
            </span>
          )}
        </div>

        {exercises.length === 0 ? (
          <Empty
            icon="dumbbell"
            title="Nenhum exercício ainda"
            text="Busque na lista e marque vários de uma vez. Séries, reps e descanso já vêm preenchidos."
          />
        ) : (
          <ol className="ex-list">
            {exercises.map((exercise, index) => (
              <li key={exercise.key} className="card ex-row">
                <button type="button" className="ex-row-main" onClick={() => setEditing({ exercise, isNew: false })}>
                  <span className="ex-num">{index + 1}</span>
                  <span className="ex-text">
                    <strong>{exercise.name}</strong>
                    <span className="muted small">
                      {[exerciseGroup(exercise), exerciseSummary(exercise)].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </button>
                <div className="move-btns">
                  <IconButton
                    icon="up"
                    label={`Subir ${exercise.name}`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    size={20}
                  />
                  <IconButton
                    icon="down"
                    label={`Descer ${exercise.name}`}
                    disabled={index === exercises.length - 1}
                    onClick={() => move(index, 1)}
                    size={20}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}

        <button type="button" className="btn btn-secondary btn-block" onClick={() => setPicking(true)}>
          <Icon name="plus" size={20} />
          Adicionar exercícios
        </button>
      </section>

      <div className="actionbar">
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="button" className="btn btn-primary btn-lg btn-block" disabled={busy} onClick={save}>
          {busy ? 'Salvando…' : id ? 'Salvar alterações' : 'Criar treino'}
        </button>
      </div>

      <ExerciseSheet
        exercise={editing?.exercise || null}
        isNew={false}
        onClose={() => setEditing(null)}
        onSave={saveExercise}
        onRemove={removeExercise}
      />

      <ExercisePicker
        open={picking}
        onClose={() => setPicking(false)}
        onAdd={addExercises}
        excluded={exercises.map((exercise) => exercise.name)}
      />
    </div>
  )
}
