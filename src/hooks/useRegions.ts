import { regions } from '../data/regions'
import type { Region } from '../types/atlas'

export function useRegions(): Region[] {
  return regions
}
