import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { formatLoad } from '../format'

function reorder(list, from, to) {
  if (from === to || from < 0 || to < 0 || to >= list.length) return list
  const next = list.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next.map((template, position) => ({ ...template, position: position + 1 }))
}

export function Templates() {
  const [templates, setTemplates] = useState(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(null)
  const listRef = useRef(null)
  const dragRef = useRef(null)
  const templatesRef = useRef(templates)
  templatesRef.current = templates

  useEffect(() => {
    let active = true
    api.templates().then((list) => { if (active) setTemplates(list) }).catch((caught) => { if (active) setError(caught.message) })
    return () => { active = false }
  }, [])

  async function remove(template) {
    if (!window.confirm(`Tirar ${template.name} da sequência? Os treinos já feitos continuam no histórico.`)) return
    try {
      await api.deleteTemplate(template.id)
      setTemplates((current) => current.filter((item) => item.id !== template.id))
    } catch (caught) {
      setError(caught.message)
    }
  }

  function targetIndex(clientY) {
    const rows = [...(listRef.current?.querySelectorAll('[data-id]') || [])]
    for (let index = 0; index < rows.length; index += 1) {
      const rect = rows[index].getBoundingClientRect()
      if (clientY < rect.top + rect.height / 2) return index
    }
    return Math.max(0, rows.length - 1)
  }

  function startDrag(event, index) {
    if (event.button != null && event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      index,
      origin: (templatesRef.current || []).map((template) => template.id).join(','),
      snapshot: templatesRef.current
    }
    setDragging(templatesRef.current[index].id)
  }

  function moveDrag(event) {
    const drag = dragRef.current
    if (!drag || !templatesRef.current) return
    const nextIndex = targetIndex(event.clientY)
    if (nextIndex === drag.index) return
    const next = reorder(templatesRef.current, drag.index, nextIndex)
    drag.index = nextIndex
    templatesRef.current = next
    setTemplates(next)
  }

  async function endDrag() {
    const drag = dragRef.current
    dragRef.current = null
    setDragging(null)
    if (!drag || !templatesRef.current) return
    const ids = templatesRef.current.map((template) => template.id)
    if (ids.join(',') === drag.origin) return
    setError('')
    try {
      setTemplates(await api.reorderTemplates(ids))
    } catch (caught) {
      setTemplates(drag.snapshot)
      setError(caught.message)
    }
  }

  return (
    <div>
      <h1>Meu treino</h1>
      <p className="muted">Arraste para mudar a ordem. Cada treino encerrado avança um dia e, no fim, volta para o primeiro.</p>
      {error && <p className="error">{error}</p>}
      {templates === null && <p className="muted">Carregando…</p>}
      {templates?.length === 0 && <p className="muted">Nenhum dia ainda. Adicione o primeiro treino da sequência.</p>}
      <div className={dragging ? 'sorting' : undefined} ref={listRef}>
        {templates?.map((template, index) => (
          <article className={dragging === template.id ? 'card plan-card is-dragging' : 'card plan-card'} data-id={template.id} key={template.id}>
            <button
              type="button"
              className="drag-handle"
              aria-label={`Arrastar ${template.name}`}
              onPointerDown={(event) => startDrag(event, index)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <Grip />
            </button>
            <span className="day-badge" aria-hidden="true">{index + 1}</span>
            <div className="plan-copy">
              <p className="eyebrow">Dia {index + 1}</p>
              <strong>{template.name}</strong>
              <ul className="plan-exercises">
                {template.exercises.map((exercise) => (
                  <li key={exercise.id}>
                    <span>{exercise.name}</span>
                    <span>{exercise.plannedSets}×{exercise.reps}{formatLoad(exercise.load) ? ` · ${formatLoad(exercise.load)}` : ''}</span>
                  </li>
                ))}
                {template.exercises.length === 0 && <li>Sem exercícios</li>}
              </ul>
            </div>
            <div className="row-actions">
              <Link to={`/templates/${template.id}`}>Editar</Link>
              <button type="button" className="text-button danger" onClick={() => remove(template)}>Tirar</button>
            </div>
          </article>
        ))}
      </div>
      <Link className="primary wide" to="/templates/new">Adicionar treino</Link>
    </div>
  )
}

function Grip() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M6 4h.01M12 4h.01M6 9h.01M12 9h.01M6 14h.01M12 14h.01" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
