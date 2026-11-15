import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { LineChart } from '../components/LineChart'
import { formatDay, formatNumber, formatSet, formatVolume, plural, relativeDay } from '../format'
import { Segmented } from '../ui/Fields'
import { useAsync } from '../ui/hooks'
import { Icon } from '../ui/Icon'
import { PageHeader } from '../ui/PageHeader'
import { Empty, ErrorState, Skeleton } from '../ui/States'

export function ProgressList() {
  const [query, setQuery] = useState('')
  const { data, error, loading, reload } = useAsync(() => api.exerciseNames(), [])
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

function chartDate(value, short) {
  return new Date(value).toLocaleDateString(
    'pt-BR',
    short ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'long', year: 'numeric' }
  )
}

export function ProgressDetail() {
  const [params] = useSearchParams()
  const name = params.get('nome') || ''
  const { data, error, loading, reload } = useAsync(() => api.progress(name), [name])
  const hasLoad = (data || []).some((item) => Number(item.topLoad) > 0)
  const [metric, setMetric] = useState(null)
  const active = metric || (hasLoad ? 'max' : 'reps')

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

  const points = (data || []).map((item) => ({ date: item.date, value: METRICS[active].pick(item) }))
  const options = Object.entries(METRICS)
    .filter(([key]) => hasLoad || key === 'reps')
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
            <div className="stat">
              <Icon name="trophy" size={20} />
              <strong>{formatSet(best.top.topLoad, best.top.topReps)}</strong>
              <span>melhor série</span>
            </div>
            {best.maxEstimate > 0 && (
              <div className="stat">
                <Icon name="flame" size={20} />
                <strong>{formatNumber(best.maxEstimate, 1)} kg</strong>
                <span>1RM estimado</span>
              </div>
            )}
            <div className="stat">
              <Icon name="calendar" size={20} />
              <strong>{relativeDay(data[data.length - 1].date)}</strong>
              <span>último treino</span>
            </div>
          </section>

          <section className="card">
            {options.length > 1 && <Segmented label="Métrica" value={active} onChange={setMetric} options={options} />}
            <LineChart points={points} unit={METRICS[active].unit} formatDate={chartDate} />
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
              {[...data].reverse().map((item) => (
                <Link key={item.sessionId} to={`/historico/${item.sessionId}`} className="list-item">
                  <span className="list-main">
                    <strong>
                      {formatDay(item.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </strong>
                    <span className="muted small">
                      {item.sets.map((set) => formatSet(set.load, set.reps)).join(' · ')}
                    </span>
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
