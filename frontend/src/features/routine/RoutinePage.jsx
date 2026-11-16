import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PackSheet } from '@/features/routine/components/PackSheet'
import { dayLetter, nextInRoutine, orderedDays } from '@/features/routine/lib/schedule'
import { sessionsApi } from '@/shared/api/sessions'
import { templatesApi } from '@/shared/api/templates'
import { useAction } from '@/shared/hooks/useAction'
import { useAsync } from '@/shared/hooks/useAsync'
import { muscleGroups } from '@/shared/lib/muscles'
import { plural } from '@/shared/lib/text'
import { estimateMinutes } from '@/shared/lib/training'
import { Icon, IconButton } from '@/shared/ui/Icon'
import { MuscleChips } from '@/shared/ui/MuscleChips'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Action, ActionList, Sheet } from '@/shared/ui/Sheet'
import { Empty, ErrorState, Skeleton } from '@/shared/ui/States'
import { useFeedback } from '@/shared/ui/feedbackContext'

export function RoutinePage() {
  const navigate = useNavigate()
  const { toast, confirm } = useFeedback()
  const runAction = useAction()
  const [organizing, setOrganizing] = useState(false)
  const [menu, setMenu] = useState(null)
  const [packs, setPacks] = useState(false)
  const { data, error, loading, reload, setData } = useAsync(
    () =>
      Promise.all([templatesApi.list(), sessionsApi.list('finished'), sessionsApi.list('open')]).then(
        ([templates, finished, open]) => ({ templates: orderedDays(templates), finished, open: open[0] || null })
      ),
    []
  )

  async function move(index, delta) {
    const list = data.templates.slice()
    const target = index + delta
    if (target < 0 || target >= list.length) return
    ;[list[index], list[target]] = [list[target], list[index]]
    const previous = data.templates
    setData((current) => ({ ...current, templates: list }))
    await runAction(
      async () => {
        const saved = await templatesApi.reorder(list.map((item) => item.id))
        setData((current) => ({ ...current, templates: orderedDays(saved) }))
      },
      () => {
        setData((current) => ({ ...current, templates: previous }))
      }
    )
  }

  async function start(template) {
    setMenu(null)
    await runAction(async () => {
      const session = await sessionsApi.create({ templateId: template.id })
      navigate(`/treino/${session.id}`)
    })
  }

  async function duplicate(template) {
    setMenu(null)
    await runAction(async () => {
      await templatesApi.create({
        name: `${template.name} (cópia)`.slice(0, 80),
        notes: template.notes || '',
        exercises: template.exercises.map(({ name, plannedSets, reps, load, restSeconds, rir, muscleGroup }) => ({
          name,
          plannedSets,
          reps,
          load,
          restSeconds,
          rir,
          muscleGroup
        }))
      })
      toast('Treino duplicado no fim da rotina.', 'success')
      reload()
    })
  }

  async function remove(template) {
    setMenu(null)
    const ok = await confirm({
      title: `Remover ${template.name}?`,
      message: 'Ele sai da rotina. Os treinos já feitos continuam no histórico.',
      confirmLabel: 'Remover',
      danger: true
    })
    if (!ok) return
    await runAction(async () => {
      await templatesApi.remove(template.id)
      setData((current) => ({ ...current, templates: current.templates.filter((item) => item.id !== template.id) }))
      toast('Treino removido.')
    })
  }

  const templates = data?.templates || []
  const next = data ? nextInRoutine(templates, data.finished) : null

  return (
    <>
      <PageHeader
        large
        title="Rotina"
        subtitle="Os treinos se alternam nesta ordem. Ao concluir um, o seguinte vira o próximo."
        actions={
          templates.length > 1 && (
            <button
              type="button"
              className={organizing ? 'btn btn-secondary btn-sm' : 'btn btn-quiet btn-sm'}
              onClick={() => setOrganizing((value) => !value)}
            >
              {organizing ? 'Pronto' : 'Reordenar'}
            </button>
          )
        }
      />

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && (
        <>
          <Skeleton />
          <Skeleton />
        </>
      )}

      {data && templates.length === 0 && (
        <Empty
          icon="routine"
          title="Nenhum treino na rotina"
          text="Crie um treino para cada dia, como A, B e C, ou comece por uma rotina pronta. Eles se alternam sozinhos."
        >
          <button type="button" className="btn btn-primary" onClick={() => setPacks(true)}>
            <Icon name="routine" size={20} />
            Usar rotina pronta
          </button>
          <Link className="btn btn-quiet" to="/rotina/novo">
            <Icon name="plus" size={20} />
            Criar do zero
          </Link>
        </Empty>
      )}

      <ol className="routine">
        {templates.map((template, index) => {
          const isNext = next?.day.id === template.id && !data.open
          return (
            <li key={template.id} className={isNext ? 'card routine-card next' : 'card routine-card'}>
              <span className="day-num lg">{dayLetter(index)}</span>
              <Link to={`/rotina/${template.id}`} className="routine-main">
                <span className="routine-title">
                  <strong>{template.name}</strong>
                  {isNext && <span className="badge sm">Próximo</span>}
                </span>
                <MuscleChips groups={muscleGroups(template.exercises)} max={3} />
                <span className="muted small">
                  {template.exercises.length
                    ? `${plural(template.exercises.length, 'exercício', 'exercícios')} · ~${estimateMinutes(template.exercises)} min`
                    : 'Sem exercícios'}
                </span>
              </Link>
              {organizing ? (
                <div className="move-btns">
                  <IconButton
                    icon="up"
                    label={`Subir ${template.name}`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    size={20}
                  />
                  <IconButton
                    icon="down"
                    label={`Descer ${template.name}`}
                    disabled={index === templates.length - 1}
                    onClick={() => move(index, 1)}
                    size={20}
                  />
                </div>
              ) : (
                <IconButton icon="more" label={`Opções de ${template.name}`} onClick={() => setMenu(template)} />
              )}
            </li>
          )
        })}
      </ol>

      {templates.length > 0 && (
        <div className="stack-sm">
          <Link className="btn btn-secondary btn-block" to="/rotina/novo">
            <Icon name="plus" size={20} />
            Novo treino
          </Link>
          <button type="button" className="btn btn-quiet btn-block" onClick={() => setPacks(true)}>
            Usar uma rotina pronta
          </button>
        </div>
      )}

      <PackSheet
        open={packs}
        hasTemplates={templates.length > 0}
        onClose={() => setPacks(false)}
        onCreated={(pack) => {
          setPacks(false)
          toast(`Rotina ${pack.name} criada. Toque num treino para ajustar.`, 'success')
          reload()
        }}
      />

      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu?.name}>
        {menu && (
          <ActionList>
            <Action
              icon={<Icon name="play" />}
              label="Começar agora"
              hint={data?.open ? 'Há um treino em andamento' : undefined}
              disabled={!!data?.open}
              onClick={() => start(menu)}
            />
            <Action icon={<Icon name="edit" />} label="Editar" onClick={() => navigate(`/rotina/${menu.id}`)} />
            <Action icon={<Icon name="copy" />} label="Duplicar" onClick={() => duplicate(menu)} />
            <Action icon={<Icon name="trash" />} label="Remover da rotina" danger onClick={() => remove(menu)} />
          </ActionList>
        )}
      </Sheet>
    </>
  )
}
