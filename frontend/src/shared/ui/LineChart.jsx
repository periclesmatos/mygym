import { useMemo, useRef, useState } from 'react'
import { formatNumber } from '@/shared/lib/number'

const W = 340
const H = 180
const PAD = { top: 16, right: 14, bottom: 26, left: 40 }
/** Acima disto os pontos virariam uma faixa: só aparece o escolhido. */
const MAX_DOTS = 31

function niceTicks(min, max, count = 4) {
  if (min === max) {
    min -= 1
    max += 1
  }
  const raw = (max - min) / count
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) || raw
  const start = Math.floor(min / step) * step
  const end = Math.ceil(max / step) * step
  const ticks = []
  for (let value = start; value <= end + step / 2; value += step) ticks.push(Math.round(value * 100) / 100)
  return ticks
}

/** Linha de uma série só, com toque/hover mostrando o valor do ponto. */
export function LineChart({ points, unit, formatDate }) {
  const svgRef = useRef(null)
  const [active, setActive] = useState(null)

  const geometry = useMemo(() => {
    const values = points.map((point) => point.value)
    const ticks = niceTicks(Math.min(...values), Math.max(...values))
    const yMin = ticks[0]
    const yMax = ticks[ticks.length - 1]
    const innerW = W - PAD.left - PAD.right
    const innerH = H - PAD.top - PAD.bottom
    const x = (index) => PAD.left + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW)
    const y = (value) => PAD.top + innerH - ((value - yMin) / (yMax - yMin || 1)) * innerH
    const coords = points.map((point, index) => ({ ...point, cx: x(index), cy: y(point.value) }))
    const path = coords
      .map((point, index) => `${index ? 'L' : 'M'}${point.cx.toFixed(1)},${point.cy.toFixed(1)}`)
      .join(' ')
    return { ticks, y, coords, path }
  }, [points])

  function locate(event) {
    const rect = svgRef.current.getBoundingClientRect()
    const px = ((event.clientX - rect.left) / rect.width) * W
    let best = 0
    geometry.coords.forEach((point, index) => {
      if (Math.abs(point.cx - px) < Math.abs(geometry.coords[best].cx - px)) best = index
    })
    setActive(best)
  }

  const shown = active == null ? geometry.coords.length - 1 : active
  const point = geometry.coords[shown]
  const first = geometry.coords[0]
  const last = geometry.coords[geometry.coords.length - 1]

  return (
    <figure className="chart">
      <div className="chart-readout" aria-live="polite">
        <strong>
          {formatNumber(point.value, 1)} {unit}
        </strong>
        <span className="muted small">
          {formatDate(point.date)}
          {active == null ? ' · último' : ''}
        </span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Evolução de ${formatNumber(first.value, 1)} para ${formatNumber(last.value, 1)} ${unit}`}
        onPointerMove={locate}
        onPointerDown={locate}
        onPointerLeave={() => setActive(null)}
      >
        {geometry.ticks.map((tick) => (
          <g key={tick} className="chart-grid">
            <line x1={PAD.left} x2={W - PAD.right} y1={geometry.y(tick)} y2={geometry.y(tick)} />
            <text x={PAD.left - 8} y={geometry.y(tick) + 4} textAnchor="end">
              {formatNumber(tick, 1)}
            </text>
          </g>
        ))}
        <text
          className="chart-axis"
          x={first.cx}
          y={H - 6}
          textAnchor={geometry.coords.length === 1 ? 'middle' : 'start'}
        >
          {formatDate(first.date, true)}
        </text>
        {geometry.coords.length > 1 && (
          <text className="chart-axis" x={last.cx} y={H - 6} textAnchor="end">
            {formatDate(last.date, true)}
          </text>
        )}
        {active != null && (
          <line className="chart-crosshair" x1={point.cx} x2={point.cx} y1={PAD.top} y2={H - PAD.bottom} />
        )}
        <path className="chart-line" d={geometry.path} />
        {geometry.coords.map((item, index) =>
          index !== shown && geometry.coords.length > MAX_DOTS ? null : (
            <circle
              key={index}
              className={index === shown ? 'chart-dot on' : 'chart-dot'}
              cx={item.cx}
              cy={item.cy}
              r={index === shown ? 5.5 : 4}
            />
          )
        )}
      </svg>
    </figure>
  )
}
