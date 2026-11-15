import { useRef } from 'react'
import { emptyExercise, formatLoad, formatRest } from '../format'

function reorder(list, from, to) {
  if (from === to || from < 0 || to < 0 || to >= list.length) return list
  const next = list.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function planLine(exercise) {
  if (!exercise.name && !exercise.reps) return 'Preencha o nome e o que vai fazer.'
  const load = formatLoad(exercise.load)
  const rir = exercise.rir === '' || exercise.rir == null ? '' : ` · RIR ${exercise.rir}`
  return `${exercise.plannedSets || '—'} séries de ${exercise.reps || '—'} reps${load ? ` · ${load}` : ''}${rir} · ${formatRest(exercise.restSeconds)}`
}

export function ExerciseList({ exercises, onChange }) {
  const listRef = useRef(null)
  const dragRef = useRef(null)
  const exercisesRef = useRef(exercises)
  exercisesRef.current = exercises

  function update(index, field, value) {
    onChange(exercises.map((exercise, current) => (
      current === index ? { ...exercise, [field]: value } : exercise
    )))
  }

  function targetIndex(clientY) {
    const rows = [...(listRef.current?.querySelectorAll('[data-drag]') || [])]
    for (let index = 0; index < rows.length; index += 1) {
      const rect = rows[index].getBoundingClientRect()
      if (clientY < rect.top + rect.height / 2) return index
    }
    return Math.max(0, rows.length - 1)
  }

  function startDrag(event, index) {
    if (event.button != null && event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { index }
  }

  function moveDrag(event) {
    const drag = dragRef.current
    if (!drag) return
    const nextIndex = targetIndex(event.clientY)
    if (nextIndex === drag.index) return
    const next = reorder(exercisesRef.current, drag.index, nextIndex)
    drag.index = nextIndex
    exercisesRef.current = next
    onChange(next)
  }

  function endDrag() {
    dragRef.current = null
  }

  return (
    <div ref={listRef}>
      {exercises.map((exercise, index) => (
        <section className="card exercise-edit" data-drag key={exercise.key || index}>
          <div className="edit-head">
            <button
              type="button"
              className="drag-handle"
              aria-label={`Arrastar exercício ${index + 1}`}
              onPointerDown={(event) => startDrag(event, index)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M6 4h.01M12 4h.01M6 9h.01M12 9h.01M6 14h.01M12 14h.01" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </button>
            <label className="edit-name">
              <span>Exercício {index + 1}</span>
              <input placeholder="Nome do exercício" value={exercise.name} onChange={(event) => update(index, 'name', event.target.value)} />
            </label>
            <button type="button" className="text-button danger" onClick={() => onChange(exercises.filter((_, current) => current !== index))} disabled={exercises.length === 1}>Remover</button>
          </div>
          <p className="muted small plan-line">{planLine(exercise)}</p>
          <div className="edit-grid">
            <label className="field"><span>Séries</span><input inputMode="numeric" value={exercise.plannedSets} onChange={(event) => update(index, 'plannedSets', event.target.value)} /></label>
            <label className="field"><span>Repetições</span><input value={exercise.reps} onChange={(event) => update(index, 'reps', event.target.value)} /></label>
            <label className="field"><span>Carga (kg)</span><input inputMode="decimal" value={exercise.load} onChange={(event) => update(index, 'load', event.target.value)} /></label>
            <label className="field"><span>RIR, reserva</span><input inputMode="numeric" value={exercise.rir} onChange={(event) => update(index, 'rir', event.target.value)} /></label>
            <label className="field span-2"><span>Descanso (segundos)</span><input inputMode="numeric" value={exercise.restSeconds} onChange={(event) => update(index, 'restSeconds', event.target.value)} /></label>
          </div>
        </section>
      ))}
      <button type="button" className="secondary wide" onClick={() => onChange([...exercises, emptyExercise()])}>Adicionar exercício</button>
    </div>
  )
}
