import { farms } from '../data/farms'
import type { Farm } from '../types/coffee'

export function useFarms(): Farm[] {
  return farms
}
