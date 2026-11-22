import { useAsync } from '@/shared/hooks/useAsync'
import { formatDay, parseDateKey } from '@/shared/lib/date'
import { formatNumber } from '@/shared/lib/number'
import { Icon } from '@/shared/ui/Icon'
import { ErrorState, Skeleton } from '@/shared/ui/States'
import { rankingApi } from '@/shared/api/ranking'

function byCategory(trophies) {
  const map = new Map()
  for (const trophy of trophies) map.set(trophy.category, [...(map.get(trophy.category) || []), trophy])
  return [...map.entries()]
}

export function Trophies() {
  const { data, error, reload } = useAsync(() => rankingApi.trophies(), [])
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <Skeleton lines={5} />
  const won = data.filter((trophy) => trophy.achievedOn).length
  return (
    <>
      <section className="card trophy-total">
        <Icon name="trophy" size={32} />
        <strong className="tabular">
          {won} de {data.length}
        </strong>
        <div className="rank-bar" aria-hidden="true">
          <span style={{ width: `${(won / data.length) * 100}%` }} />
        </div>
      </section>
      {byCategory(data).map(([category, items]) => (
        <section className="section" key={category}>
          <div className="section-head">
            <h2>{category}</h2>
            <span className="muted small">
              {items.filter((trophy) => trophy.achievedOn).length}/{items.length}
            </span>
          </div>
          <ul className="trophy-grid">
            {items.map((trophy) => (
              <li key={trophy.key} className={trophy.achievedOn ? `trophy won tier-${trophy.tier}` : 'trophy'}>
                <span className="trophy-icon">
                  <Icon name={trophy.secret ? 'lock' : 'trophy'} size={26} filled={Boolean(trophy.achievedOn)} />
                </span>
                <strong>{trophy.name}</strong>
                <span className="muted trophy-text">{trophy.description}</span>
                {trophy.achievedOn && (
                  <span className="trophy-date">
                    {formatDay(parseDateKey(trophy.achievedOn), { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
                {!trophy.achievedOn && !trophy.secret && (
                  <>
                    <div className="rank-bar thin" aria-hidden="true">
                      <span style={{ width: `${Math.min(1, trophy.current / trophy.goal) * 100}%` }} />
                    </div>
                    <span className="muted trophy-text tabular">
                      {formatNumber(trophy.current, 1)} de {formatNumber(trophy.goal, 1)} {trophy.unit}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}
