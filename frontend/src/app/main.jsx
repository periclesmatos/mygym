import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from '@/app/App'
import { applyTheme, savedTheme } from '@/shared/lib/theme'
import { FeedbackProvider } from '@/shared/ui/Feedback'
import '@/app/styles.css'

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
