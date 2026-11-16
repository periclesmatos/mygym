import { useEffect, useState } from 'react'
import { useCatalog } from '@/features/routine/hooks/useCatalog'
import { draftFromCatalog, findInCatalog } from '@/features/routine/lib/catalog'
import { emptyExercise, exercisePayload } from '@/features/routine/lib/exerciseModel'
import { PACKS } from '@/features/routine/lib/packs'
import { dayLetter } from '@/features/routine/lib/schedule'
import { templatesApi } from '@/shared/api/templates'
import { useAction } from '@/shared/hooks/useAction'
import { muscleGroups } from '@/shared/lib/muscles'
import { plural } from '@/shared/lib/text'
import { MuscleChips } from '@/shared/ui/MuscleChips'
import { Sheet } from '@/shared/ui/Sheet'
import { Skeleton } from '@/shared/ui/States'

/** Exercícios de um dia da rotina pronta, já com as sugestões do catálogo. */
function dayExercises(day, catalog) {
  return day.exercises.map((name) => {
    const item = findInCatalog(catalog.items, name)
    return item ? draftFromCatalog(item, catalog.previous) : { ...emptyExercise(), name }
  })
}

/** Folha para criar uma rotina inteira a partir de um modelo. Os treinos entram no fim da rotina. */
export function PackSheet({ open, onClose, onCreated, hasTemplates }) {
  const catalog = useCatalog()
  const runAction = useAction()
  const [chosen, setChosen] = useState(PACKS[0].id)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) setBusy(false)
  }, [open])

  const pack = PACKS.find((item) => item.id === chosen)

  async function create() {
    setBusy(true)
    const ok = await runAction(async () => {
      for (const day of pack.days) {
        await templatesApi.create({
          name: day.name,
          notes: '',
          exercises: dayExercises(day, catalog).map(exercisePayload)
        })
      }
    })
    setBusy(false)
    if (ok) onCreated(pack)
  }

  const footer = (
    <button
      type="button"
      className="btn btn-primary btn-lg btn-block"
      disabled={busy || catalog.items.length === 0}
      onClick={create}
    >
      {busy ? 'Criando…' : `Criar ${plural(pack.days.length, 'treino', 'treinos')}`}
    </button>
  )

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Rotinas prontas"
      subtitle={
        hasTemplates
          ? 'Os treinos entram no fim da sua rotina. Depois é só ajustar.'
          : 'Escolha um modelo para começar. Depois é só ajustar.'
      }
      footer={footer}
    >
      {catalog.loading && catalog.items.length === 0 ? (
        <Skeleton lines={4} />
      ) : (
        <div className="pack-list" role="radiogroup" aria-label="Rotinas prontas">
          {PACKS.map((item) => {
            const on = item.id === chosen
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={on}
                className={on ? 'card pack on' : 'card pack'}
                onClick={() => setChosen(item.id)}
              >
                <span className="pack-head">
                  <strong>{item.name}</strong>
                  <span className="muted small">{plural(item.days.length, 'treino', 'treinos')}</span>
                </span>
                <span className="muted small">{item.description}</span>
                {on && (
                  <span className="pack-days">
                    {item.days.map((day, index) => (
                      <span key={day.name} className="pack-day">
                        <span className="day-num">{dayLetter(index)}</span>
                        <span className="pack-day-text">
                          <strong>{day.name}</strong>
                          <MuscleChips groups={muscleGroups(dayExercises(day, catalog))} max={3} />
                        </span>
                      </span>
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </Sheet>
  )
}
