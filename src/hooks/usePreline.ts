import { useEffect } from 'react'

let prelinePromise: Promise<typeof import('preline')> | undefined

function loadPreline() {
  prelinePromise ??= import('preline')
  return prelinePromise
}

export function usePreline(deps: unknown[] = []) {
  useEffect(() => {
    let isActive = true

    void loadPreline().then(({ HSStaticMethods }) => {
      if (!isActive || typeof window === 'undefined') {
        return
      }

      window.HSStaticMethods = HSStaticMethods
      HSStaticMethods.autoInit()
    })

    return () => {
      isActive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
