import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MonthCalendar } from '@/features/history/components/MonthCalendar'
import { SessionItem } from '@/features/history/components/SessionItem'
import { useAsync } from '@/shared/hooks/useAsync'
import { capitalize, plural } from '@/shared/lib/text'
import { Segmented } from '@/shared/ui/Fields'
import { Icon } from '@/shared/ui/Icon'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Empty, ErrorState, Skeleton } from '@/shared/ui/States'
import { sessionsApi } from '@/shared/api/workout'

function groupByMonth(sessions) {
  const groups = []
  for (const session of sessions) {
    const date = new Date(session.finishedAt)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    let group = groups[groups.length - 1]
    if (!group || group.key !== key) {
      group = {
        key,
        label: capitalize(date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })),
        items: []
      }
      groups.push(group)
    }
    group.items.push(session)
  }
  return groups
}

export function HistoryPage() {
  const [view, setView] = useState('list')
  const { data, error, loading, reload } = useAsync(() => sessionsApi.list('finished'), [])

  return (
    <>
      <PageHeader large title="Histórico" />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && (
        <>
          <Skeleton />
          <Skeleton lines={2} />
        </>
      )}
      {data?.length === 0 && (
        <Empty
          icon="history"
          title="Nenhum treino concluído"
          text="Os treinos que você concluir aparecem aqui, com séries, cargas e volume."
        >
          <Link className="btn btn-primary" to="/">
            Ir para o início
          </Link>
        </Empty>
      )}
      {data?.length > 0 && (
        <>
          <Segmented
            label="Visualização"
            value={view}
            onChange={setView}
            options={[
              { value: 'list', label: 'Lista', icon: <Icon name="list" size={18} /> },
              { value: 'calendar', label: 'Calendário', icon: <Icon name="calendar" size={18} /> }
            ]}
          />
          {view === 'calendar' ? (
            <MonthCalendar sessions={data} />
          ) : (
            groupByMonth(data).map((group) => (
              <section className="section" key={group.key}>
                <div className="section-head">
                  <h2>{group.label}</h2>
                  <span className="muted small">{plural(group.items.length, 'treino', 'treinos')}</span>
                </div>
                <div className="list">
                  {group.items.map((session) => (
                    <SessionItem key={session.id} session={session} />
                  ))}
                </div>
              </section>
            ))
          )}
        </>
      )}
    </>
  )
}
