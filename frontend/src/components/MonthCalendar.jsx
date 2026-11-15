import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dateKey } from '../format'
import { sessionsByDay, trainedPath } from '../plan'

const WEEKDAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']
const MARKS = ['#ff6a3d', '#3ddec0', '#f0b429', '#8b93ff', '#ff7ab2']

function markOf(session) {
  const seed = session.templateId ?? [...(session.name || '')].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return MARKS[Math.abs(seed) % MARKS.length]
}

function shortName(name) {
  const word = (name || '').trim().split(/\s+/)[0] || ''
  return word.length > 7 ? `${word.slice(0, 6)}…` : word
}

export function MonthCalendar({ sessions }) {
  const navigate = useNavigate()
  const today = new Date()
  const todayKey = dateKey(today)
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [slide, setSlide] = useState('next')
  const drag = useRef(null)
  const swiped = useRef(false)
  const byDay = useMemo(() => sessionsByDay(sessions), [sessions])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)]
  const rawLabel = cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)
  const viewingToday = year === today.getFullYear() && month === today.getMonth()

  function shift(amount) {
    setSlide(amount > 0 ? 'next' : 'prev')
    setCursor(new Date(year, month + amount, 1))
  }

  function goToday() {
    const next = new Date(today.getFullYear(), today.getMonth(), 1)
    setSlide(next.getTime() > cursor.getTime() ? 'next' : 'prev')
    setCursor(next)
  }

  function pointerDown(event) {
    swiped.current = false
    drag.current = { x: event.clientX, y: event.clientY }
  }

  function pointerUp(event) {
    if (!drag.current) return
    const dx = event.clientX - drag.current.x
    const dy = event.clientY - drag.current.y
    drag.current = null
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy)) return
    swiped.current = true
    shift(dx < 0 ? 1 : -1)
  }

  return (
    <section className="card calendar" onPointerDown={pointerDown} onPointerUp={pointerUp}>
      <div className="row cal-head-row">
        <div>
          <h2 className="cal-title">{label}</h2>
          <p className="muted small cal-hint">Toque no dia para abrir o treino.</p>
        </div>
        <div className="cal-tools">
          {!viewingToday && <button type="button" className="text-button" onClick={goToday}>Hoje</button>}
          <button type="button" className="icon-button" onClick={() => shift(-1)} aria-label="Mês anterior">‹</button>
          <button type="button" className="icon-button" onClick={() => shift(1)} aria-label="Próximo mês">›</button>
        </div>
      </div>
      <div className={`cal-grid slide-${slide}`} key={`${year}-${month}`}>
        {WEEKDAYS.map((weekday) => <span className="cal-head" key={weekday}>{weekday}</span>)}
        {cells.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />
          const key = dateKey(new Date(year, month, day))
          const daySessions = byDay.get(key) || []
          const trained = daySessions.length > 0
          const className = ['cal-day', trained ? 'has' : '', key === todayKey ? 'today' : ''].filter(Boolean).join(' ')
          const labelName = trained ? shortName(daySessions[0].name) : ''
          return (
            <button
              type="button"
              key={key}
              className={className}
              style={trained ? { '--mark': markOf(daySessions[0]) } : undefined}
              aria-label={trained ? `Abrir ${daySessions.map((session) => session.name).join(', ')}` : `Dia ${day}`}
              onClick={() => {
                if (swiped.current || !trained) return
                navigate(trainedPath(key, daySessions))
              }}
            >
              <span className="cal-num">{day}</span>
              {trained && <span className="cal-mark">{daySessions.length > 1 ? `${labelName} +${daySessions.length - 1}` : labelName}</span>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
