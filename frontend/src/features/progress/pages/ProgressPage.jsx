import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LineChart } from '@/features/progress/components/LineChart'
import { useAsync } from '@/shared/hooks/useAsync'
import { formatCardio, formatKm } from '@/shared/lib/cardio'
import { formatDay, relativeDay } from '@/shared/lib/date'
import { formatNumber } from '@/shared/lib/number'
import { plural } from '@/shared/lib/text'
import { formatEntry, formatSet, formatVolume } from '@/shared/lib/training'
import { Segmented } from '@/shared/ui/Fields'
import { Icon } from '@/shared/ui/Icon'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatCard } from '@/shared/ui/StatCard'
import { Empty, ErrorState, Skeleton } from '@/shared/ui/States'
import { progressApi } from '@/shared/api/progress'

export function ProgressListPage() {
  const [query, setQuery] = useState('')
  const { data, error, loading, reload } = useAsync(() => progressApi.names(), [])
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return (data || []).filter((name) => name.toLowerCase().includes(term))
  }, [data, query])

  return (
    <>
      <PageHeader
        large
        title="Evolução"
        subtitle="Escolha um exercício para ver cargas e recordes ao longo do tempo."
      />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Skeleton lines={5} />}
      {data?.length === 0 && (
        <Empty
          icon="chart"
          title="Nada para mostrar ainda"
          text="Conclua treinos com cargas e repetições e a evolução de cada exercício aparece aqui."
        />
      )}
      {data?.length > 0 && (
        <>
          <div className="search">
            <Icon name="search" size={20} />
            <input
              className="input"
              type="search"
              placeholder="Buscar exercício"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Buscar exercício"
            />
          </div>
          <div className="list">
            {filtered.map((name) => (
              <Link key={name} className="list-item" to={`/evolucao/exercicio?nome=${encodeURIComponent(name)}`}>
                <span className="list-main">
                  <strong>{name}</strong>
                </span>
                <Icon name="forward" size={18} className="muted" />
              </Link>
            ))}
            {filtered.length === 0 && <p className="muted center">Nenhum exercício com “{query}”.</p>}
          </div>
        </>
      )}
    </>
  )
}

const METRICS = {
  max: { label: '1RM', unit: 'kg', pick: (item) => Number(item.estimatedMax) || 0 },
  load: { label: 'Carga', unit: 'kg', pick: (item) => Number(item.topLoad) || 0 },
  reps: { label: 'Reps', unit: 'reps', pick: (item) => Math.max(...item.sets.map((set) => set.reps || 0)) },
  volume: { label: 'Volume', unit: 'kg', pick: (item) => Number(item.volume) || 0 }
}

const CARDIO_METRICS = {
  minutes: { label: 'Minutos', unit: 'min', pick: (item) => Math.round(item.durationSeconds / 60) },
  distance: { label: 'Distância', unit: 'km', pick: (item) => item.distanceMeters / 1000 }
}

function chartDate(value, short) {
  return new Date(value).toLocaleDateString(
    'pt-BR',
    short ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'long', year: 'numeric' }
  )
}

export function ProgressDetailPage() {
  const [params] = useSearchParams()
  const name = params.get('nome') || ''
  const { data, error, loading, reload } = useAsync(() => progressApi.progress(name), [name])
  const hasLoad = (data || []).some((item) => Number(item.topLoad) > 0)
  const [metric, setMetric] = useState(null)
  const cardio = Boolean(data?.length && data[data.length - 1].cardio)
  const records = (data || []).filter((item) => Boolean(item.cardio) === cardio)
  const metrics = cardio ? CARDIO_METRICS : METRICS
  const fallback = cardio ? 'minutes' : hasLoad ? 'max' : 'reps'
  const active = metrics[metric] ? metric : fallback
  const hasDistance = records.some((item) => item.distanceMeters > 0)

  const best = useMemo(() => {
    if (!data?.length) return null
    let top = data[0]
    for (const item of data) {
      const load = Number(item.topLoad) || 0
      const topLoad = Number(top.topLoad) || 0
      if (load > topLoad || (load === topLoad && (item.topReps || 0) > (top.topReps || 0))) top = item
    }
    const maxEstimate = Math.max(...data.map((item) => Number(item.estimatedMax) || 0))
    return { top, maxEstimate }
  }, [data])

  const points = records.map((item) => ({ date: item.date, value: metrics[active].pick(item) }))
  const options = Object.entries(metrics)
    .filter(([key]) => (cardio ? key === 'minutes' || hasDistance : hasLoad || key === 'reps'))
    .map(([value, item]) => ({ value, label: item.label }))

  return (
    <>
      <PageHeader
        back="/evolucao"
        title={name || 'Exercício'}
        subtitle={data?.length ? `${plural(data.length, 'treino registrado', 'treinos registrados')}` : undefined}
      />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && (
        <>
          <Skeleton lines={2} />
          <Skeleton lines={6} />
        </>
      )}
      {data?.length === 0 && (
        <Empty
          icon="chart"
          title="Sem registros ainda"
          text="Quando você concluir um treino com este exercício, a evolução aparece aqui."
        />
      )}
      {data?.length > 0 && (
        <>
          <section className="stats">
            {cardio ? (
              <StatCard
                icon="run"
                value={formatCardio(Math.max(...records.map((item) => item.durationSeconds)))}
                label="maior duração"
              />
            ) : (
              <StatCard icon="trophy" value={formatSet(best.top.topLoad, best.top.topReps)} label="melhor série" />
            )}
            {cardio && hasDistance && (
              <StatCard
                icon="flame"
                value={formatKm(Math.max(...records.map((item) => item.distanceMeters)))}
                label="maior distância"
              />
            )}
            {!cardio && best.maxEstimate > 0 && (
              <StatCard icon="flame" value={`${formatNumber(best.maxEstimate, 1)} kg`} label="1RM estimado" />
            )}
            <StatCard icon="calendar" value={relativeDay(data[data.length - 1].date)} label="último treino" />
          </section>

          <section className="card">
            {options.length > 1 && <Segmented label="Métrica" value={active} onChange={setMetric} options={options} />}
            <LineChart points={points} unit={metrics[active].unit} formatDate={chartDate} />
            {active === 'max' && (
              <p className="muted small">
                Estimativa de 1 repetição máxima pela fórmula de Epley: carga × (1 + reps ÷ 30), na melhor série do dia.
              </p>
            )}
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Registros</h2>
            </div>
            <div className="list">
              {[...records].reverse().map((item) => (
                <Link key={item.sessionId} to={`/historico/${item.sessionId}`} className="list-item">
                  <span className="list-main">
                    <strong>
                      {formatDay(item.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </strong>
                    <span className="muted small">{item.sets.map(formatEntry).join(' · ')}</span>
                  </span>
                  {formatVolume(item.volume) && (
                    <span className="list-meta muted small">{formatVolume(item.volume)}</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  )
}
