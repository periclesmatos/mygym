import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { applyTheme, savedTheme } from './theme'
import { FeedbackProvider } from './ui/Feedback'
import './styles.css'

window.matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', () => {
  if (savedTheme() === 'system') applyTheme('system')
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </BrowserRouter>
  </StrictMode>
)
