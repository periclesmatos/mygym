import { useEffect, useId, useState } from 'react'
import { useExerciseNames } from '@/features/routine/hooks/useExerciseNames'
import { emptyExercise, validateExercise } from '@/features/routine/lib/exerciseModel'
import { formatRest } from '@/shared/lib/date'
import { Chips, Stepper } from '@/shared/ui/Fields'
import { Icon } from '@/shared/ui/Icon'
import { Sheet } from '@/shared/ui/Sheet'

const REPS = ['5', '6-8', '8-10', '8-12', '10-12', '12-15', '15-20']
const RESTS = [30, 45, 60, 90, 120, 180, 240].map((value) => ({ value, label: formatRest(value) }))

/**
 * Folha para criar ou editar um exercício.
 * `exercise` nulo fecha a folha; `isNew` troca os textos.
 */
export function ExerciseSheet({ exercise, isNew, onSave, onRemove, onClose, saveLabel }) {
  const listId = useId()
  const names = useExerciseNames()
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

  async function submit(event) {
    event.preventDefault()
    const message = validateExercise(draft)
    if (message) {
      setError(message)
      return
    }
    setBusy(true)
    try {
      await onSave(draft)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={!!exercise} onClose={onClose} title={isNew ? 'Novo exercício' : 'Editar exercício'}>
      <form className="stack" onSubmit={submit} noValidate>
        <label className="field">
          <span className="field-label">Nome</span>
          <input
            data-autofocus={isNew ? true : undefined}
            className="input"
            list={listId}
            placeholder="Ex.: Supino reto"
            autoComplete="off"
            enterKeyHint="next"
            value={draft.name}
            onChange={(event) => set('name', event.target.value)}
          />
          <datalist id={listId}>
            {names.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>

        <div className="grid-2">
          <Stepper
            label="Séries"
            value={draft.plannedSets}
            onChange={(value) => set('plannedSets', value)}
            min={1}
            max={20}
            inputMode="numeric"
          />
          <Stepper
            label="Carga"
            value={draft.load}
            onChange={(value) => set('load', value)}
            step={2.5}
            suffix="kg"
            placeholder="—"
            allowEmpty
          />
        </div>

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
