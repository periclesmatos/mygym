import { useEffect, useMemo, useState } from 'react'
import { useCatalog } from '@/features/routine/hooks/useCatalog'
import { EQUIPMENT, MUSCLE_GROUPS, findInCatalog, muscleGroup, normalizeText, searchCatalog } from '@/features/catalog'
import { draftFromCatalog } from '@/features/routine/domain/drafts'
import { useAction } from '@/shared/hooks/useAction'
import { plural } from '@/shared/lib/text'
import { Chips } from '@/shared/ui/Fields'
import { Icon, IconButton } from '@/shared/ui/Icon'
import { Sheet } from '@/shared/ui/Sheet'
import { ErrorState, Skeleton } from '@/shared/ui/States'
import { useFeedback } from '@/shared/ui/feedbackContext'
import { catalogApi } from '@/shared/api/catalog'

/**
 * Folha para escolher um ou vários exercícios do catálogo.
 * `onAdd` recebe os rascunhos já preenchidos (séries, reps, descanso e grupo).
 */
export function ExercisePicker({ open, onClose, onAdd, title = 'Adicionar exercícios', excluded = [] }) {
  const catalog = useCatalog()
  const runAction = useAction()
  const { confirm, toast } = useFeedback()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('')
  const [selected, setSelected] = useState([])
  const [creating, setCreating] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) return
    setQuery('')
    setGroup('')
    setSelected([])
    setCreating(null)
    setBusy(false)
  }, [open])

  const results = useMemo(
    () => searchCatalog(catalog.items, query, { group, used: catalog.used }),
    [catalog.items, catalog.used, query, group]
  )
  const already = useMemo(() => new Set(excluded.map(normalizeText)), [excluded])
  const exact = query.trim() ? findInCatalog(catalog.items, query) : null
  const selectedIds = new Set(selected.map((item) => item.id))

  function toggle(item) {
    setSelected((current) =>
      current.some((entry) => entry.id === item.id)
        ? current.filter((entry) => entry.id !== item.id)
        : [...current, item]
    )
  }

  function startCreating() {
    const name = query.trim().replace(/\s+/g, ' ')
    setCreating({ name, muscleGroup: group || muscleGroup(name) || '', equipment: '', error: '' })
  }

  async function create() {
    if (!creating.muscleGroup) {
      setCreating((current) => ({ ...current, error: 'Escolha o grupo muscular.' }))
      return
    }
    await runAction(async () => {
      const item = await catalogApi.createCustom({
        name: creating.name,
        muscleGroup: creating.muscleGroup,
        equipment: creating.equipment || null
      })
      catalog.add(item)
      setSelected((current) => [...current, item])
      setCreating(null)
      setQuery('')
      toast(`${item.name} criado e selecionado.`, 'success')
    })
  }

  async function removeCustom(item) {
    const ok = await confirm({
      title: `Apagar ${item.name}?`,
      message: 'Ele sai da sua lista de exercícios. Treinos e histórico que já usam esse nome não mudam.',
      confirmLabel: 'Apagar',
      danger: true
    })
    if (!ok) return
    await runAction(async () => {
      await catalogApi.removeCustom(item.id)
      catalog.remove(item.id)
      setSelected((current) => current.filter((entry) => entry.id !== item.id))
    })
  }

  async function confirmSelection() {
    if (selected.length === 0) return
    setBusy(true)
    try {
      await onAdd(selected.map((item) => draftFromCatalog(item, catalog.previous)))
    } finally {
      setBusy(false)
    }
  }

  const footer = (
    <button
      type="button"
      className="btn btn-primary btn-lg btn-block"
      disabled={selected.length === 0 || busy}
      onClick={confirmSelection}
    >
      {busy
        ? 'Adicionando…'
        : selected.length === 0
          ? 'Escolha os exercícios'
          : `Adicionar ${plural(selected.length, 'exercício', 'exercícios')}`}
    </button>
  )

  return (
    <Sheet open={open} onClose={onClose} title={title} footer={footer}>
      <div className="picker">
        <div className="picker-head">
          <div className="search">
            <Icon name="search" size={20} />
            <input
              data-autofocus
              className="input"
              type="search"
              placeholder="Buscar: supino, puxada, leg…"
              autoComplete="off"
              enterKeyHint="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setCreating(null)
              }}
            />
          </div>
          <div className="filter-row" role="radiogroup" aria-label="Grupo muscular">
            {['', ...MUSCLE_GROUPS].map((value) => (
              <button
                key={value || 'todos'}
                type="button"
                role="radio"
                aria-checked={group === value}
                className={group === value ? 'filter-chip on' : 'filter-chip'}
                onClick={() => setGroup(value)}
              >
                {value || 'Todos'}
              </button>
            ))}
          </div>
          {selected.length > 0 && (
            <p className="muted small picker-selected">
              <strong>{selected.length}</strong> · {selected.map((item) => item.name).join(', ')}
            </p>
          )}
        </div>

        {catalog.error && catalog.items.length === 0 ? (
          <ErrorState message={catalog.error} onRetry={catalog.reload} />
        ) : catalog.loading && catalog.items.length === 0 ? (
          <Skeleton lines={5} />
        ) : (
          <>
            {query.trim() && !exact && !creating && (
              <button type="button" className="pick-row create" onClick={startCreating}>
                <span className="pick-check">
                  <Icon name="plus" size={18} />
                </span>
                <span className="pick-text">
                  <strong>Criar “{query.trim()}”</strong>
                  <span className="muted small">Fica salvo na sua lista de exercícios</span>
                </span>
              </button>
            )}

            {creating && (
              <div className="card picker-create stack">
                <strong>Novo exercício: {creating.name}</strong>
                <div className="field">
                  <span className="field-label">Grupo muscular</span>
                  <Chips
                    label="Grupo muscular"
                    options={MUSCLE_GROUPS.map((value) => ({ value, label: value }))}
                    value={creating.muscleGroup}
                    onChange={(value) => setCreating((current) => ({ ...current, muscleGroup: value, error: '' }))}
                  />
                </div>
                <div className="field">
                  <span className="field-label">Equipamento (opcional)</span>
                  <Chips
                    label="Equipamento"
                    options={EQUIPMENT.map((value) => ({ value, label: value }))}
                    value={creating.equipment}
                    onChange={(value) =>
                      setCreating((current) => ({ ...current, equipment: current.equipment === value ? '' : value }))
                    }
                  />
                </div>
                {creating.error && (
                  <p className="form-error" role="alert">
                    {creating.error}
                  </p>
                )}
                <div className="btn-row">
                  <button type="button" className="btn btn-quiet" onClick={() => setCreating(null)}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-secondary grow" onClick={create}>
                    Criar e selecionar
                  </button>
                </div>
              </div>
            )}

            {results.length === 0 && !query.trim() && (
              <p className="muted picker-empty">Nenhum exercício neste grupo.</p>
            )}

            <ul className="pick-list">
              {results.map((item) => {
                const on = selectedIds.has(item.id)
                const info = [item.muscleGroup, item.equipment].filter(Boolean).join(' · ')
                const inWorkout = already.has(normalizeText(item.name))
                return (
                  <li key={item.id} className="pick-item">
                    <button
                      type="button"
                      className={on ? 'pick-row on' : 'pick-row'}
                      aria-pressed={on}
                      onClick={() => toggle(item)}
                    >
                      <span className="pick-check">{on && <Icon name="check" size={16} strokeWidth={3} />}</span>
                      <span className="pick-text">
                        <strong>{item.name}</strong>
                        <span className="muted small">
                          {info}
                          {item.custom && ' · seu'}
                          {inWorkout
                            ? ' · já está no treino'
                            : catalog.used.has(normalizeText(item.name)) && ' · já fez'}
                        </span>
                      </span>
                    </button>
                    {item.custom && (
                      <IconButton
                        icon="trash"
                        label={`Apagar ${item.name}`}
                        size={18}
                        onClick={() => removeCustom(item)}
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </Sheet>
  )
}
