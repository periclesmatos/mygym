import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { capitalize, dateKey, plural } from '../format'
import { dayPath, sessionsByDay } from '../plan'
import { IconButton } from '../ui/Icon'

const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

export function MonthCalendar({ sessions }) {
  const navigate = useNavigate()
  const today = new Date()
  const todayKey = dateKey(today)
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const drag = useRef(null)
  const swiped = useRef(false)
  const byDay = useMemo(() => sessionsByDay(sessions), [sessions])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)]
  const label = capitalize(cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))
  const isCurrent = year === today.getFullYear() && month === today.getMonth()
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const count = sessions.filter((session) => dateKey(session.finishedAt).startsWith(monthPrefix)).length

  function shift(amount) {
    setCursor(new Date(year, month + amount, 1))
  }

  return (
    <section
      className="card calendar"
      onPointerDown={(event) => {
        swiped.current = false
        drag.current = { x: event.clientX, y: event.clientY }
      }}
      onPointerUp={(event) => {
        if (!drag.current) return
        const dx = event.clientX - drag.current.x
        const dy = event.clientY - drag.current.y
        drag.current = null
        if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy)) return
        swiped.current = true
        shift(dx < 0 ? 1 : -1)
      }}
    >
      <div className="cal-head">
        <div>
          <h2>{label}</h2>
          <p className="muted small">{count ? plural(count, 'treino', 'treinos') : 'Nenhum treino'}</p>
        </div>
        <div className="cal-tools">
          {!isCurrent && (
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            >
              Hoje
            </button>
          )}
          <IconButton icon="back" label="Mês anterior" onClick={() => shift(-1)} size={20} />
          <IconButton icon="forward" label="Próximo mês" onClick={() => shift(1)} size={20} />
        </div>
      </div>
      <div className="cal-grid">
        {WEEKDAYS.map((weekday, index) => (
          <span className="cal-weekday" key={index}>
            {weekday}
          </span>
        ))}
        {cells.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />
          const key = dateKey(new Date(year, month, day))
          const daySessions = byDay.get(key) || []
          const trained = daySessions.length > 0
          const future = key > todayKey
          const classes = ['cal-day', trained && 'trained', key === todayKey && 'today', future && 'future']
            .filter(Boolean)
            .join(' ')
          if (!trained)
            return (
              <span key={key} className={classes}>
                {day}
              </span>
            )
          return (
            <button
              type="button"
              key={key}
              className={classes}
              aria-label={`${day}: ${daySessions.map((session) => session.name).join(', ')}`}
              title={daySessions.map((session) => session.name).join(', ')}
              onClick={() => {
                if (!swiped.current) navigate(dayPath(key, daySessions))
              }}
            >
              {day}
              {daySessions.length > 1 && <i className="cal-count">{daySessions.length}</i>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
