import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import 'preline/preline'

function PrelineWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.HSStaticMethods) {
      window.HSStaticMethods.autoInit()
    }
  }, [])
  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrelineWrapper>
      <App />
    </PrelineWrapper>
  </StrictMode>,
)
