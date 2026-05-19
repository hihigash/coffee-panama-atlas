import { useEffect } from 'react'

export function usePreline(deps: unknown[] = []) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.HSStaticMethods) {
      window.HSStaticMethods.autoInit()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
