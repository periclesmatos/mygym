import { useSearchParams } from 'react-router-dom'
import { MyRank } from '@/features/ranking/components/MyRank'
import { Trophies } from '@/features/ranking/components/Trophies'
import { Segmented } from '@/shared/ui/Fields'
import { PageHeader } from '@/shared/ui/PageHeader'

const VIEWS = [
  { value: 'meu', label: 'Meu rank' },
  { value: 'trofeus', label: 'Troféus' }
]

export function RankPage() {
  const [params, setParams] = useSearchParams()
  const asked = params.get('aba')
  const view = VIEWS.some((item) => item.value === asked) ? asked : 'meu'
  return (
    <>
      <PageHeader large title="Rank" />
      <Segmented
        label="Seções do rank"
        options={VIEWS}
        value={view}
        onChange={(value) => setParams(value === 'meu' ? {} : { aba: value }, { replace: true })}
      />
      {view === 'meu' && <MyRank />}
      {view === 'trofeus' && <Trophies />}
    </>
  )
}
