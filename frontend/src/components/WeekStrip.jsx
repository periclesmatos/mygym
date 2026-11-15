import { Link } from 'react-router-dom'
import { dateKey } from '../format'
import { dayPath, sessionsByDay, weekStart } from '../plan'
import { Icon } from '../ui/Icon'

const LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export function WeekStrip({ sessions }) {
  const byDay = sessionsByDay(sessions)
  const today = new Date()
  const todayKey = dateKey(today)
  const start = weekStart(today)
  return (
    <div className="week" aria-label="Esta semana">
      {LABELS.map((label, index) => {
        const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
        const key = dateKey(date)
        const daySessions = byDay.get(key) || []
        const trained = daySessions.length > 0
        const classes = ['week-day', key === todayKey && 'today', trained && 'trained', key > todayKey && 'future'].filter(Boolean).join(' ')
        const content = (
          <>
            <span className="week-label">{label}</span>
            <span className="week-dot">{trained ? <Icon name="check" size={16} strokeWidth={3} /> : date.getDate()}</span>
          </>
        )
        if (!trained) return <div className={classes} key={key}>{content}</div>
        return (
          <Link className={classes} key={key} to={dayPath(key, daySessions)} aria-label={`${label}: ${daySessions.map((session) => session.name).join(', ')}`}>
            {content}
          </Link>
        )
      })}
    </div>
  )
}
