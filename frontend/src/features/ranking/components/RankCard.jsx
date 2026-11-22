import { Link } from 'react-router-dom'
import { RankSummary } from '@/features/ranking/components/RankSummary'
import { useAsync } from '@/shared/hooks/useAsync'
import { Skeleton } from '@/shared/ui/States'
import { rankingApi } from '@/shared/api/ranking'

/** Card do rank no Início. */
export function RankCard() {
  const { data, error, reload } = useAsync(() => rankingApi.overview(), [])
  if (error) {
    return (
      <button type="button" className="btn btn-quiet btn-block" onClick={reload}>
        Não deu para carregar o rank. Tentar de novo
      </button>
    )
  }
  if (!data) return <Skeleton lines={3} />
  return (
    <Link to="/rank" className={`card rank-card rank-${data.rank.key}`}>
      <RankSummary overview={data} />
    </Link>
  )
}
