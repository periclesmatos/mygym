import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PENDING_CHANGED } from '@/features/social/domain/pending'
import { useAsync } from '@/shared/hooks/useAsync'
import { socialApi } from '@/shared/api/social'

/** Quantos pedidos de amizade esperam resposta. */
export function PendingBadge() {
  const { pathname } = useLocation()
  const { data, reload } = useAsync(() => socialApi.pending(), [pathname])
  useEffect(() => {
    window.addEventListener(PENDING_CHANGED, reload)
    return () => window.removeEventListener(PENDING_CHANGED, reload)
  }, [reload])
  if (!data?.count) return null
  return (
    <span className="tab-badge" aria-label={`${data.count} pedidos de amizade`}>
      {data.count > 9 ? '9+' : data.count}
    </span>
  )
}
