import { useState } from 'react'
import { RankSummary } from '@/features/ranking/components/RankSummary'
import { points } from '@/features/ranking/domain/rankText'
import { useAsync } from '@/shared/hooks/useAsync'
import { formatDay, parseDateKey } from '@/shared/lib/date'
import { formatNumber } from '@/shared/lib/number'
import { plural } from '@/shared/lib/text'
import { LineChart } from '@/shared/ui/LineChart'
import { RankBadge } from '@/shared/ui/RankBadge'
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

/** Nove ranks; cada um com os pontos de cada divisão. */
function tiers(ladder) {
  const map = new Map()
  for (const step of ladder) map.set(step.key, [...(map.get(step.key) || []), step])
  return [...map.values()].reverse()
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
        <RankSummary overview={overview} size={92} />
        {peak.date && (
          <p className="muted small rank-peak">
            Recorde: <strong>{peak.rank.label}</strong> em {chartDate(peak.date)}
          </p>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Escada</h2>
          <span className="muted small">9 ranks</span>
        </div>
        <ol className="ladder">
          {tiers(ladder).map((steps) => {
            const current = steps[0].key === rank.key
            const reached = rank.index >= steps[0].index
            const shown = current ? rank : steps[steps.length - 1]
            return (
              <li
                key={steps[0].key}
                className={`rank-${steps[0].key}${current ? ' current' : ''}${reached ? '' : ' ahead'}`}
                aria-current={current ? 'step' : undefined}
              >
                <RankBadge rank={{ ...shown, division: 0 }} size={42} />
                <span className="ladder-name">
                  <strong>{steps[0].name}</strong>
                  {current && <span className="small">você está aqui</span>}
                </span>
                <span className="ladder-floors tabular">
                  {steps.map((step) => (
                    <span key={step.index} className={step.index === rank.index ? 'on' : ''}>
                      {step.division > 0 && <i>{'I'.repeat(step.division)}</i>}
                      {formatNumber(step.floor, 0)}
                    </span>
                  ))}
                </span>
              </li>
            )
          })}
        </ol>
      </section>

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
