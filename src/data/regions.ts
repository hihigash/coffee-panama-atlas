import type { Region, RegionId } from '../types/atlas'

export const regions: Region[] = [
  {
    id: 'boquete',
    name: 'Boquete',
    description:
      'Boquete is Panama\'s most celebrated coffee valley, where steep volcanic slopes, cool mist, and old-growth shade create a benchmark profile for floral and tea-like Gesha lots.',
    climate:
      'Cool mountain mornings, frequent cloud cover, and rainfall moderated by Pacific and Caribbean weather systems.',
    terroir: ['Volcanic loam soils', 'High-elevation cloud forest', 'Large day-to-night temperature swings'],
  },
  {
    id: 'tierras-altas',
    name: 'Tierras Altas',
    description:
      'Centered around Volcán and Nueva California, Tierras Altas delivers broad plateaus and dramatic mountain ridges that support some of Panama\'s highest coffee plantings.',
    climate:
      'Bright sunny days, crisp nights, and strong mountain winds that slow cherry maturation and intensify sweetness.',
    terroir: ['Exposed highland ridges', 'Young volcanic deposits', 'Open-canopy sunlight with cool evening temperatures'],
  },
  {
    id: 'renacimiento',
    name: 'Renacimiento',
    description:
      'Along Panama\'s western frontier, Renacimiento combines forest biodiversity with slightly warmer lower elevations, producing layered coffees with tropical fruit and cacao depth.',
    climate:
      'Humid afternoons, protected valleys, and a longer ripening season influenced by forests along the Costa Rica border.',
    terroir: ['Forest-buffered microclimates', 'Mixed volcanic and alluvial soils', 'Gentler slopes with abundant biodiversity'],
  },
]

const regionNames: Record<RegionId, string> = {
  boquete: 'Boquete',
  'tierras-altas': 'Tierras Altas',
  renacimiento: 'Renacimiento',
}

const regionBadgeClasses: Record<RegionId, string> = {
  boquete: 'bg-region-boquete/15 text-region-boquete dark:bg-region-boquete/20 dark:text-green-200',
  'tierras-altas': 'bg-region-tierras/15 text-region-tierras dark:bg-region-tierras/20 dark:text-amber-200',
  renacimiento: 'bg-region-renacimiento/15 text-region-renacimiento dark:bg-region-renacimiento/20 dark:text-blue-200',
}

const regionFilterActiveClasses: Record<RegionId, string> = {
  boquete: 'border-region-boquete bg-region-boquete text-white shadow-sm shadow-region-boquete/25',
  'tierras-altas': 'border-region-tierras bg-region-tierras text-white shadow-sm shadow-region-tierras/25',
  renacimiento: 'border-region-renacimiento bg-region-renacimiento text-white shadow-sm shadow-region-renacimiento/25',
}

export function getRegionName(regionId: RegionId): string {
  return regionNames[regionId]
}

export function getRegionBadgeClassName(regionId: RegionId): string {
  return `inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${regionBadgeClasses[regionId]}`
}

export function getRegionFilterClassName(regionId: RegionId, active: boolean): string {
  if (active) {
    return `border-transparent ${regionFilterActiveClasses[regionId]}`
  }

  return 'border-neutral-200 bg-white text-neutral-700 hover:border-coffee-200 hover:text-coffee-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-coffee-600 dark:hover:text-coffee-300'
}
