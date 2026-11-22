import { useCallback, useEffect, useRef, useState } from 'react'
import { draftFrom, findSet, parseDraft } from '@/features/workout/domain/session'
import { progressApi } from '@/shared/api/progress'
import { sessionsApi } from '@/shared/api/workout'

const AUTOSAVE_DELAY = 700

/**
 * Estado do treino em andamento: a sessão vinda da API, os rascunhos de cada série (o que está
 * nos campos) e o "última vez" de cada exercício. Edições são salvas sozinhas após uma pausa na
 * digitação; `flushAll` salva o que estiver pendente.
 *
 * Os refs espelham o estado para que callbacks assíncronos sempre vejam o valor mais recente.
 */
export function useWorkoutSession(id, { onError, onAlreadyFinished }) {
  const sessionId = Number(id)
  const [session, setSession] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [last, setLast] = useState({})
  const [loadError, setLoadError] = useState('')
  const sessionRef = useRef(null)
  const draftsRef = useRef({})
  const timers = useRef({})
  const callbacks = useRef({ onError, onAlreadyFinished })
  useEffect(() => {
    callbacks.current = { onError, onAlreadyFinished }
  })

  /** Troca a sessão inteira (resposta da API), mantendo rascunhos das séries que continuam. */
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

  /** Altera campos de uma série localmente, sem chamar a API. */
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

  function cancelPending(setIds) {
    for (const setId of setIds) {
      clearTimeout(timers.current[setId])
      delete timers.current[setId]
    }
  }

  function cancelAllPending() {
    cancelPending(Object.keys(timers.current))
  }

  /** Salva o rascunho da série. Devolve a sessão atualizada, ou null se falhou. */
  async function persist(setId, completed) {
    cancelPending([setId])
    const draft = draftsRef.current[setId]
    if (!draft) return null
    const { values, error } = parseDraft(draft)
    if (error) {
      callbacks.current.onError(error)
      return null
    }
    try {
      const updated = await sessionsApi.updateSet(sessionId, setId, { ...values, completed })
      const fresh = findSet(updated, setId)
      if (fresh && sessionRef.current)
        patchSet(setId, { completedAt: fresh.completedAt, reps: fresh.reps, load: fresh.load, rir: fresh.rir })
      return updated
    } catch (caught) {
      callbacks.current.onError(caught.message)
      return null
    }
  }

  const isCompleted = (setId) => Boolean(findSet(sessionRef.current, setId)?.completedAt)

  function flushAll() {
    return Promise.all(Object.keys(timers.current).map((key) => persist(Number(key), isCompleted(Number(key)))))
  }

  /** Atualiza um campo e agenda o salvamento. */
  function changeDraft(setId, field, value) {
    setDraft(setId, { [field]: value })
    clearTimeout(timers.current[setId])
    timers.current[setId] = setTimeout(() => persist(setId, isCompleted(setId)), AUTOSAVE_DELAY)
  }

  function loadLast(names) {
    progressApi
      .last(names, sessionRef.current?.startedAt)
      .then((map) => setLast((current) => ({ ...current, ...map })))
      .catch(() => {})
  }

  useEffect(() => {
    let active = true
    sessionsApi
      .get(id)
      .then((data) => {
        if (!active) return
        if (data.finishedAt) {
          callbacks.current.onAlreadyFinished(data)
          return
        }
        applySession(data)
        progressApi
          .last(
            data.exercises.map((exercise) => exercise.name),
            data.startedAt
          )
          .then((map) => {
            if (active) setLast(map)
          })
          .catch(() => {})
      })
      .catch((caught) => {
        if (active) setLoadError(caught.message)
      })
    return () => {
      active = false
      // Salva o que ainda estava aguardando o atraso de digitação.
      flushAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return {
    sessionId,
    session,
    sessionRef,
    drafts,
    draftsRef,
    last,
    loadError,
    applySession,
    patchSet,
    setDraft,
    changeDraft,
    persist,
    flushAll,
    cancelPending,
    cancelAllPending,
    loadLast
  }
}
