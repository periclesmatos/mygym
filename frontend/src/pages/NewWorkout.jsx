import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { ExerciseList } from '../components/ExerciseList'
import { emptyExercise, exercisePayload, validateExercises } from '../format'

export function NewWorkout() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [exercises, setExercises] = useState([emptyExercise()])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function start(event) {
    event.preventDefault()
    const exerciseError = validateExercises(exercises)
    if (exerciseError) { setError(exerciseError); return }
    setBusy(true)
    setError('')
    try {
      const session = await api.createSession({ name: name.trim(), exercises: exercises.map(exercisePayload) })
      navigate(`/workout/${session.id}`)
    } catch (caught) {
      setError(caught.message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={start}>
      <h1>Treino avulso</h1>
      <p className="muted">Este treino não entra na sequência. Ele aparece no calendário do mesmo jeito.</p>
      {error && <p className="error">{error}</p>}
      <label className="field"><span>Nome</span><input placeholder="Treino avulso" value={name} onChange={(event) => setName(event.target.value)} /></label>
      <ExerciseList exercises={exercises} onChange={setExercises} />
      <button className="primary wide" type="submit" disabled={busy}>{busy ? 'Começando…' : 'Começar treino'}</button>
    </form>
  )
}
