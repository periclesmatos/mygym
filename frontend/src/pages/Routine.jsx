import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { estimateMinutes, plural } from '../format'
import { dayLetter, nextInRoutine, orderedDays } from '../plan'
import { useFeedback } from '../ui/feedbackContext'
import { useAsync } from '../ui/hooks'
import { Icon, IconButton } from '../ui/Icon'
import { PageHeader } from '../ui/PageHeader'
import { Action, ActionList, Sheet } from '../ui/Sheet'
import { Empty, ErrorState, Skeleton } from '../ui/States'

export function Routine() {
  const navigate = useNavigate()
  const { toast, confirm } = useFeedback()
  const [organizing, setOrganizing] = useState(false)
  const [menu, setMenu] = useState(null)
  const { data, error, loading, reload, setData } = useAsync(
    () =>
      Promise.all([api.templates(), api.sessions('finished'), api.sessions('open')]).then(
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
    try {
      const saved = await api.reorderTemplates(list.map((item) => item.id))
      setData((current) => ({ ...current, templates: orderedDays(saved) }))
    } catch (caught) {
      setData((current) => ({ ...current, templates: previous }))
      toast(caught.message, 'error')
    }
  }

  async function start(template) {
    setMenu(null)
    try {
      const session = await api.createSession({ templateId: template.id })
      navigate(`/treino/${session.id}`)
    } catch (caught) {
      toast(caught.message, 'error')
    }
  }

  async function duplicate(template) {
    setMenu(null)
    try {
      await api.createTemplate({
        name: `${template.name} (cópia)`.slice(0, 80),
        notes: template.notes || '',
        exercises: template.exercises.map(({ name, plannedSets, reps, load, restSeconds, rir }) => ({
          name,
          plannedSets,
          reps,
          load,
          restSeconds,
          rir
        }))
      })
      toast('Treino duplicado no fim da rotina.', 'success')
      reload()
    } catch (caught) {
      toast(caught.message, 'error')
    }
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
    try {
      await api.deleteTemplate(template.id)
      setData((current) => ({ ...current, templates: current.templates.filter((item) => item.id !== template.id) }))
      toast('Treino removido.')
    } catch (caught) {
      toast(caught.message, 'error')
    }
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
          text="Crie um treino para cada dia, como A, B e C. Eles se alternam sozinhos."
        >
          <Link className="btn btn-primary" to="/rotina/novo">
            <Icon name="plus" size={20} />
            Criar treino
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
                <span className="muted small routine-exercises">
                  {template.exercises.length
                    ? template.exercises.map((exercise) => exercise.name).join(' · ')
                    : 'Sem exercícios'}
                </span>
                <span className="muted small">
                  {plural(template.exercises.length, 'exercício', 'exercícios')} · ~
                  {estimateMinutes(template.exercises)} min
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
        <Link className="btn btn-secondary btn-block" to="/rotina/novo">
          <Icon name="plus" size={20} />
          Novo treino
        </Link>
      )}

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
