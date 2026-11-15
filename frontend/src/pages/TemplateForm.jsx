import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { ExerciseList } from '../components/ExerciseList'
import { emptyExercise, exercisePayload, validateExercises } from '../format'

export function TemplateForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState([emptyExercise()])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return undefined
    let active = true
    api.template(id).then((template) => {
      if (!active) return
      setName(template.name)
      setNotes(template.notes || '')
      setExercises(template.exercises.map((exercise) => ({
        key: crypto.randomUUID(),
        name: exercise.name,
        plannedSets: exercise.plannedSets,
        reps: exercise.reps,
        load: exercise.load ?? '',
        restSeconds: exercise.restSeconds,
        rir: exercise.rir ?? ''
      })))
    }).catch((caught) => { if (active) setError(caught.message) })
    return () => { active = false }
  }, [id])

  async function save(event) {
    event.preventDefault()
    if (!name.trim()) { setError('Informe o nome do treino.'); return }
    const exerciseError = validateExercises(exercises)
    if (exerciseError) { setError(exerciseError); return }
    setBusy(true)
    setError('')
    const body = { name: name.trim(), notes: notes.trim(), exercises: exercises.map(exercisePayload) }
    try {
      if (id) await api.updateTemplate(id, body)
      else await api.createTemplate(body)
      navigate('/templates')
    } catch (caught) {
      setError(caught.message)
      setBusy(false)
    }
  }

  async function remove() {
    if (!window.confirm('Tirar este treino da sequência? Os treinos já feitos continuam no histórico.')) return
    try {
      await api.deleteTemplate(id)
      navigate('/templates')
    } catch (caught) {
      setError(caught.message)
    }
  }

  return (
    <form onSubmit={save}>
      <h1>{id ? 'Editar treino' : 'Novo treino'}</h1>
      {!id && <p className="muted">Ele entra no fim da sequência. A ordem pode ser mudada em Meu treino.</p>}
      {error && <p className="error">{error}</p>}
      <label className="field"><span>Nome</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="field"><span>Observações</span><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      <ExerciseList exercises={exercises} onChange={setExercises} />
      <button className="primary wide" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar treino'}</button>
      {id && <button className="text-button danger wide" type="button" onClick={remove}>Tirar da sequência</button>}
    </form>
  )
}
