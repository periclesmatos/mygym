import { useEffect, useMemo, useState } from 'react'
import { useCatalog } from '@/features/routine/hooks/useCatalog'
import { findInCatalog, muscleGroup, searchCatalog } from '@/features/catalog'
import { emptyExercise, validateExercise } from '@/features/routine/domain/exerciseModel'
import { CARDIO_GROUP, inMinutes, targetMinutes } from '@/shared/lib/cardio'
import { formatRest } from '@/shared/lib/date'
import { Chips, Stepper } from '@/shared/ui/Fields'
import { Icon } from '@/shared/ui/Icon'
import { Sheet } from '@/shared/ui/Sheet'

const REPS = ['5', '6-8', '8-10', '8-12', '10-12', '12-15', '15-20']
const MINUTES = ['10', '15', '20', '30', '45', '60'].map((value) => ({ value, label: `${value} min` }))
const RESTS = [30, 45, 60, 90, 120, 180, 240].map((value) => ({ value, label: formatRest(value) }))

/**
 * Folha para criar ou editar um exercício.
 * `exercise` nulo fecha a folha; `isNew` troca os textos.
 */
export function ExerciseSheet({ exercise, isNew, onSave, onRemove, onClose, saveLabel }) {
  const catalog = useCatalog()
  const [suggesting, setSuggesting] = useState(false)
  const [draft, setDraft] = useState(exercise || emptyExercise())
  const [error, setError] = useState('')
  const [showRir, setShowRir] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!exercise) return
    setDraft(exercise)
    setError('')
    setBusy(false)
    setShowRir(exercise.rir !== '' && exercise.rir != null)
  }, [exercise])

  function set(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
    setError('')
  }

  // O grupo vem do exercício cadastrado; sem cadastro, o salvo antes ou o deduzido pelo nome.
  const match = findInCatalog(catalog.items, draft.name)
  const group =
    match?.muscleGroup || (draft.name === exercise?.name && draft.muscleGroup) || muscleGroup(draft.name) || ''
  const suggestions = useMemo(
    () => (draft.name.trim() ? searchCatalog(catalog.items, draft.name, { used: catalog.used }).slice(0, 6) : []),
    [catalog.items, catalog.used, draft.name]
  )
  // Um exercício salvo em reps segue em reps ao editar; novo ou com outro nome segue o grupo.
  const cardio = group === CARDIO_GROUP && (inMinutes(exercise?.reps) || draft.name !== exercise?.name)
  // Ao virar cardio, "8-12" reps não é duração: cai em 20 min.
  const minutes = /min/i.test(draft.reps) ? String(targetMinutes(draft.reps) || '') : '20'
  const showSuggestions =
    suggesting && suggestions.length > 0 && !(match && suggestions[0].id === match.id && suggestions.length === 1)

  function pick(item) {
    set('name', item.name)
    if (item.muscleGroup === CARDIO_GROUP) {
      set('reps', item.reps)
      set('plannedSets', '1')
    }
    setSuggesting(false)
  }

  async function submit(event) {
    event.preventDefault()
    const values = cardio
      ? { ...draft, muscleGroup: group, reps: `${minutes} min`, load: '', rir: '', restSeconds: '0' }
      : { ...draft, muscleGroup: group }
    const message = validateExercise(values)
    if (message) {
      setError(message)
      return
    }
    setBusy(true)
    try {
      await onSave(values)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={!!exercise} onClose={onClose} title={isNew ? 'Novo exercício' : 'Editar exercício'}>
      <form className="stack" onSubmit={submit} noValidate>
        <div className="field">
          <label className="field-label" htmlFor="exercise-name">
            Nome
          </label>
          <div className="suggest">
            <input
              id="exercise-name"
              data-autofocus={isNew ? true : undefined}
              className="input"
              placeholder="Ex.: Supino reto"
              autoComplete="off"
              enterKeyHint="next"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls="exercise-suggestions"
              value={draft.name}
              onChange={(event) => {
                set('name', event.target.value)
                setSuggesting(true)
              }}
              onFocus={() => setSuggesting(true)}
              onBlur={() => setSuggesting(false)}
            />
            {showSuggestions && (
              <ul className="suggest-list" id="exercise-suggestions" role="listbox">
                {suggestions.map((item) => (
                  <li key={item.id} role="option" aria-selected={match?.id === item.id}>
                    <button
                      type="button"
                      className="suggest-item"
                      // mousedown antes do blur do campo, para o clique não se perder
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => pick(item)}
                    >
                      <strong>{item.name}</strong>
                      <span className="muted small">
                        {[item.muscleGroup, item.equipment].filter(Boolean).join(' · ')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {group && (
            <span className="muted small exercise-group">
              <span className="tag main">{group}</span>
              {match?.equipment && <span>{match.equipment}</span>}
              {!match && <span>deduzido pelo nome</span>}
            </span>
          )}
        </div>

        {cardio && (
          <div className="field">
            <span className="field-label">Duração de cada trecho</span>
            <Stepper
              label="Minutos"
              value={minutes}
              onChange={(value) => set('reps', `${value} min`)}
              step={5}
              min={1}
              max={600}
              inputMode="numeric"
            />
            <Chips
              label="Sugestões de duração"
              options={MINUTES}
              value={minutes}
              onChange={(value) => set('reps', `${value} min`)}
            />
          </div>
        )}

        <div className="grid-2">
          <Stepper
            label={cardio ? 'Trechos' : 'Séries'}
            value={draft.plannedSets}
            onChange={(value) => set('plannedSets', value)}
            min={1}
            max={20}
            inputMode="numeric"
          />
          {!cardio && (
            <Stepper
              label="Carga"
              value={draft.load}
              onChange={(value) => set('load', value)}
              step={2.5}
              suffix="kg"
              placeholder="—"
              allowEmpty
            />
          )}
        </div>

        {!cardio && (
          <>
            <div className="field">
              <span className="field-label">Repetições</span>
              <input
                className="input"
                value={draft.reps}
                onChange={(event) => set('reps', event.target.value)}
                placeholder="8-12"
              />
              <Chips
                label="Sugestões de repetições"
                options={REPS.map((value) => ({ value, label: value }))}
                value={draft.reps}
                onChange={(value) => set('reps', value)}
              />
            </div>

            <div className="field">
              <span className="field-label">Descanso entre séries</span>
              <Chips
                label="Descanso"
                options={RESTS}
                value={draft.restSeconds}
                onChange={(value) => set('restSeconds', value)}
              />
              <Stepper
                value={draft.restSeconds}
                onChange={(value) => set('restSeconds', value)}
                step={15}
                min={0}
                max={3600}
                suffix="s"
                inputMode="numeric"
                label="Descanso em segundos"
              />
            </div>

            {showRir ? (
              <Stepper
                label="RIR alvo (repetições na reserva)"
                value={draft.rir}
                onChange={(value) => set('rir', value)}
                min={0}
                max={10}
                inputMode="numeric"
                placeholder="—"
                allowEmpty
              />
            ) : (
              <button type="button" className="link-btn" onClick={() => setShowRir(true)}>
                <Icon name="plus" size={18} /> Definir RIR alvo
              </button>
            )}
          </>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="btn-row">
          {onRemove && !isNew && (
            <button type="button" className="btn btn-quiet danger-text" onClick={onRemove}>
              <Icon name="trash" size={18} /> Remover
            </button>
          )}
          <button type="submit" className="btn btn-primary grow" disabled={busy}>
            {busy ? 'Salvando…' : saveLabel || (isNew ? 'Adicionar' : 'Salvar')}
          </button>
        </div>
      </form>
    </Sheet>
  )
}
