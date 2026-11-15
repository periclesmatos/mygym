import { useParams } from 'react-router-dom'
import { api } from '../api'
import { dateKey, formatDay, parseDateKey } from '../format'
import { useAsync } from '../ui/hooks'
import { PageHeader } from '../ui/PageHeader'
import { Empty, ErrorState, Skeleton } from '../ui/States'
import { SessionItem } from './History'

export function HistoryDay() {
  const { date } = useParams()
  const { data, error, loading, reload } = useAsync(
    () => api.sessions('finished').then((list) => list.filter((session) => dateKey(session.finishedAt) === date)),
    [date]
  )
  const parsed = parseDateKey(date)
  return (
    <>
      <PageHeader back="/historico" title={parsed ? formatDay(parsed) : 'Dia'} />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Skeleton lines={2} />}
      {data?.length === 0 && <Empty icon="calendar" title="Nenhum treino neste dia" />}
      {data?.length > 0 && (
        <div className="list">
          {data.map((session) => (
            <SessionItem key={session.id} session={session} />
          ))}
        </div>
      )}
    </>
  )
}
