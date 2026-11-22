import { MyRank } from '@/features/ranking/components/MyRank'
import { PageHeader } from '@/shared/ui/PageHeader'

export function RankPage() {
  return (
    <>
      <PageHeader large title="Rank" />
      <MyRank />
    </>
  )
}
