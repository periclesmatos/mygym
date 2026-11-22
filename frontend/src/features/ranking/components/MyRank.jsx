import { useState } from 'react'
import { Ladder } from '@/features/ranking/components/Ladder'
import { RankSummary } from '@/features/ranking/components/RankSummary'
import { points } from '@/features/ranking/domain/rankText'
import { useAsync } from '@/shared/hooks/useAsync'
import { formatDay, parseDateKey } from '@/shared/lib/date'
import { plural } from '@/shared/lib/text'
import { LineChart } from '@/shared/ui/LineChart'
import { ErrorState, Skeleton } from '@/shared/ui/States'
import { rankingApi } from '@/shared/api/ranking'

const FIRST_DAYS = 7

function day(key) {
  return formatDay(parseDateKey(key), { weekday: 'short', day: 'numeric', month: 'short' })
}

function chartDate(key, short) {
  return formatDay(parseDateKey(key), short ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'long' })
}

function breakdown(item) {
  return [
    `presença ${item.presence}`,
    item.strength ? `séries ${item.strength}` : '',
    item.cardio ? `cardio ${item.cardio}` : '',
    item.presence + item.strength + item.cardio > item.total ? `teto ${item.total}` : ''
  ]
    .filter(Boolean)
    .join(' · ')
}

export function MyRank() {
  const { data, error, reload } = useAsync(() => rankingApi.details(), [])
  const [allDays, setAllDays] = useState(false)
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data)
    return (
      <>
        <Skeleton lines={3} />
        <Skeleton lines={5} />
      </>
    )
  const { overview, ladder, history, days, bonuses, upcoming } = data
  const { rank, peak } = overview
  const shownDays = allDays ? days : days.slice(0, FIRST_DAYS)
  const leaving = upcoming.filter((item) => item.lost > 0)

  return (
    <>
      <section className={`card rank-card rank-${rank.key}`}>
        <RankSummary overview={overview} size={72} />
        {peak.date && (
          <p className="muted small rank-peak">
            Recorde: <strong>{peak.rank.label}</strong> em {chartDate(peak.date)}
          </p>
        )}
      </section>

      <Ladder ladder={ladder} overview={overview} />

      {history.some((item) => item.points > 0) && (
        <section className="section">
          <div className="section-head">
            <h2>Seus 90 dias</h2>
          </div>
          <div className="card">
            <LineChart
              points={history.map((item) => ({ date: item.date, value: item.points }))}
              unit="pts"
              formatDate={chartDate}
            />
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>Saem nos próximos 7 dias</h2>
        </div>
        <ul className="card points-list">
          {leaving.map((item) => (
            <li key={item.date}>
              <span>{day(item.date)}</span>
              <strong className="tabular">−{points(item.lost)}</strong>
            </li>
          ))}
          {leaving.length === 0 && <li className="muted small">Nada sai esta semana.</li>}
        </ul>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Extrato por dia</h2>
          {days.length > FIRST_DAYS && (
            <button type="button" className="link-btn" onClick={() => setAllDays(!allDays)}>
              {allDays ? 'Ver menos' : `Ver os ${days.length}`}
            </button>
          )}
        </div>
        <ul className="card points-list">
          {shownDays.map((item) => (
            <li key={item.date}>
              <span>
                {day(item.date)}
                <small>{item.resting ? '7º dia da semana: descanso, não soma' : breakdown(item)}</small>
              </span>
              <strong className="tabular">{item.resting ? '—' : `+${item.total}`}</strong>
            </li>
          ))}
          {days.length === 0 && <li className="muted small">Conclua um treino para começar a pontuar.</li>}
        </ul>
        {bonuses.length > 0 && (
          <details className="card how">
            <summary>Bônus de semana: +{bonuses.reduce((sum, item) => sum + item.points, 0)}</summary>
            <ul className="points-list">
              {bonuses.map((item) => (
                <li key={item.start}>
                  <span>
                    Semana de {chartDate(item.start, true)}
                    <small>{plural(item.days, 'dia', 'dias')}</small>
                  </span>
                  <strong className="tabular">+{item.points}</strong>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <details className="card how">
        <summary>Como funciona</summary>
        <ul>
          <li>Contam os últimos 90 dias. Todo dia o mais antigo sai, sem reset.</li>
          <li>O dia vale com 5 séries ou 10 min de cardio e já começa com 30 pontos de presença.</li>
          <li>Cada série vale 3 pontos, até 60. Carga não dá ponto.</li>
          <li>Cardio vale 1 ponto por minuto leve, 1,5 no moderado e 2 no intenso, até 60.</li>
          <li>O dia vai até 100 pontos.</li>
          <li>Bônus da semana: 3 dias +40, 4 dias +60, 5 ou mais +80.</li>
          <li>Contam os 6 melhores dias da semana. O outro é descanso.</li>
          <li>Treino retroativo pontua se registrado em até 7 dias.</li>
          <li>Subir é na hora. Para cair, você tem 7 dias de proteção.</li>
        </ul>
      </details>
    </>
  )
}
