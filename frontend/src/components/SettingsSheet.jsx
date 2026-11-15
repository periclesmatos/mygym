import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearToken } from '../api'
import { applyTheme, savedTheme } from '../theme'
import { Segmented } from '../ui/Fields'
import { Icon } from '../ui/Icon'
import { Action, ActionList, Sheet } from '../ui/Sheet'

export function SettingsSheet({ open, onClose }) {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(savedTheme)

  return (
    <Sheet open={open} onClose={onClose} title="Ajustes">
      <div className="stack">
        <div className="field">
          <span className="field-label">Tema</span>
          <Segmented
            label="Tema"
            value={theme}
            onChange={(value) => setTheme(applyTheme(value))}
            options={[
              { value: 'system', label: 'Sistema', icon: <Icon name="monitor" size={18} /> },
              { value: 'light', label: 'Claro', icon: <Icon name="sun" size={18} /> },
              { value: 'dark', label: 'Escuro', icon: <Icon name="moon" size={18} /> }
            ]}
          />
        </div>
        <ActionList>
          <Action
            icon={<Icon name="logout" />}
            label="Sair"
            danger
            onClick={() => { clearToken(); navigate('/login', { replace: true }) }}
          />
        </ActionList>
      </div>
    </Sheet>
  )
}
