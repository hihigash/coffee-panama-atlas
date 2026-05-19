import { regions } from '../data/regions'
import type { Region } from '../types/coffee'

export function useRegions(): Region[] {
  return regions
}
