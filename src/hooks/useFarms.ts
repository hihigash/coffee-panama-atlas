import { farms } from '../data/farms'
import type { Farm } from '../types/atlas'

export function useFarms(): Farm[] {
  return farms
}
