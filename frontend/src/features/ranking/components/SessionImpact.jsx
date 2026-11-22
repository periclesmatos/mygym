import { impactText } from '@/features/ranking/domain/rankText'
import { useAsync } from '@/shared/hooks/useAsync'
import { Icon } from '@/shared/ui/Icon'
import { RankBadge } from '@/shared/ui/RankBadge'
import { rankingApi } from '@/shared/api/ranking'

/** O que um treino vale no rank; logo após concluir, também mostra a promoção. */
export function SessionImpact({ sessionId, finishedAt, celebrate }) {
  const { data } = useAsync(() => rankingApi.impact(sessionId), [sessionId, finishedAt])
  if (!data) return null
  const { title, text } = impactText(data)
  return (
    <>
      {celebrate && data.promotion && (
        <section className={`card promotion rank-${data.promotion.key}`} aria-live="polite">
          <RankBadge rank={data.promotion} size={88} />
          <span className="muted small">Subiu de rank!</span>
          <strong className="rank-name">{data.promotion.label}</strong>
        </section>
      )}
      {celebrate && data.trophies.length > 0 && (
        <section className="card trophy-new" aria-live="polite">
          <span className="muted small">{data.trophies.length === 1 ? 'Troféu novo' : 'Troféus novos'}</span>
          {data.trophies.map((trophy) => (
            <div key={trophy.key} className={`trophy-line tier-${trophy.tier}`}>
              <Icon name="trophy" size={24} filled />
              <span>
                <strong>{trophy.name}</strong>
                <small className="muted">{trophy.description}</small>
              </span>
            </div>
          ))}
        </section>
      )}
      <p className={data.status === 'SCORED' ? 'impact scored' : 'impact'}>
        <Icon name="rank" size={18} />
        <span>
          <strong>{title}</strong> {text}
        </span>
      </p>
    </>
  )
}
