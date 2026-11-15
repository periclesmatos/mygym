import { useParams } from 'react-router-dom'
import { SessionItem } from '@/features/history/components/SessionItem'
import { sessionsApi } from '@/shared/api/sessions'
import { useAsync } from '@/shared/hooks/useAsync'
import { dateKey, formatDay, parseDateKey } from '@/shared/lib/date'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Empty, ErrorState, Skeleton } from '@/shared/ui/States'

export function HistoryDayPage() {
  const { date } = useParams()
  const { data, error, loading, reload } = useAsync(
    () => sessionsApi.list('finished').then((list) => list.filter((session) => dateKey(session.finishedAt) === date)),
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
