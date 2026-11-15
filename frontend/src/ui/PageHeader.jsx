import { useNavigate } from 'react-router-dom'
import { IconButton } from './Icon'

export function PageHeader({ title, subtitle, back, actions, large }) {
  const navigate = useNavigate()

  function goBack() {
    const index = window.history.state?.idx
    if (typeof index === 'number' && index > 0) navigate(-1)
    else navigate(back)
  }

  return (
    <header className={large ? 'page-header large' : 'page-header'}>
      {back && <IconButton icon="back" label="Voltar" onClick={goBack} className="back-btn" />}
      <div className="page-header-text">
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  )
}
