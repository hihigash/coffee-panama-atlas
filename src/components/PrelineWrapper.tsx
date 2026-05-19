import type { PropsWithChildren } from 'react'
import { usePreline } from '../hooks/usePreline'

export function PrelineWrapper({ children }: PropsWithChildren) {
  usePreline()

  return <>{children}</>
}
