import type { PanamaRegionId, Region } from '../types/coffee'

export const regions: Region[] = [
  {
    id: 'boquete',
    name: 'Boquete',
    description:
      "Boquete is Panama's most celebrated coffee valley, where steep volcanic slopes, cool mist, and old-growth shade create a benchmark profile for floral and tea-like Gesha lots.",
    district: 'Boquete',
    province: 'Chiriquí',
    center: { lat: 8.78, lng: -82.44 },
    altitude: { minMASL: 1200, maxMASL: 2100 },
    climateClassification: 'Cfb',
    climateNotes:
      'Cool mountain mornings, frequent cloud cover, and rainfall moderated by Pacific and Caribbean weather systems.',
    terroir: ['Volcanic loam soils', 'High-elevation cloud forest', 'Large day-to-night temperature swings'],
    notableFarms: ['elida-estate', 'esmeralda-jaramillo', 'finca-lerida-estate', 'kotowa-duncan'],
  },
  {
    id: 'tierras-altas',
    name: 'Tierras Altas',
    description:
      "Centered around Volcán and Nueva California, Tierras Altas delivers broad plateaus and dramatic mountain ridges that support some of Panama's highest coffee plantings.",
    district: 'Tierras Altas',
    province: 'Chiriquí',
    center: { lat: 8.8053, lng: -82.559 },
    altitude: { minMASL: 1300, maxMASL: 2200 },
    climateClassification: 'Cfb',
    climateNotes:
      'Bright sunny days, crisp nights, and strong mountain winds that slow cherry maturation and intensify sweetness.',
    terroir: ['Exposed highland ridges', 'Young volcanic deposits', 'Open-canopy sunlight with cool evening temperatures'],
    notableFarms: ['finca-sophia', 'carmen-estate', 'janson-los-alpes', 'bambito-estate'],
  },
  {
    id: 'renacimiento',
    name: 'Renacimiento',
    description:
      "Along Panama's western frontier, Renacimiento combines forest biodiversity with slightly warmer lower elevations, producing layered coffees with tropical fruit and cacao depth.",
    district: 'Renacimiento',
    province: 'Chiriquí',
    center: { lat: 8.82, lng: -82.86 },
    altitude: { minMASL: 900, maxMASL: 1700 },
    climateClassification: 'Am',
    climateNotes:
      'Humid afternoons, protected valleys, and a longer ripening season influenced by forests along the Costa Rica border.',
    terroir: ['Forest-buffered microclimates', 'Mixed volcanic and alluvial soils', 'Gentler slopes with abundant biodiversity'],
    notableFarms: ['cafe-de-eleta-estate', 'finca-aguilar-peralta', 'auromar-la-aurora', 'gallardo-nuguo'],
  },
]

const regionNames: Record<PanamaRegionId, string> = {
  boquete: 'Boquete',
  'tierras-altas': 'Tierras Altas',
  renacimiento: 'Renacimiento',
}

const regionBadgeClasses: Record<PanamaRegionId, string> = {
  boquete: 'bg-region-boquete/15 text-region-boquete dark:bg-region-boquete/20 dark:text-emerald-200',
  'tierras-altas': 'bg-region-tierras/15 text-region-tierras dark:bg-region-tierras/20 dark:text-amber-200',
  renacimiento: 'bg-region-renacimiento/15 text-region-renacimiento dark:bg-region-renacimiento/20 dark:text-sky-200',
}

const regionFilterActiveClasses: Record<PanamaRegionId, string> = {
  boquete: 'border-region-boquete bg-region-boquete text-white shadow-sm shadow-region-boquete/25',
  'tierras-altas': 'border-region-tierras bg-region-tierras text-white shadow-sm shadow-region-tierras/25',
  renacimiento: 'border-region-renacimiento bg-region-renacimiento text-white shadow-sm shadow-region-renacimiento/25',
}

export function getRegionName(regionId: PanamaRegionId): string {
  return regionNames[regionId]
}

export function getRegionBadgeClassName(regionId: PanamaRegionId): string {
  return `inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${regionBadgeClasses[regionId]}`
}

export function getRegionFilterClassName(regionId: PanamaRegionId, active: boolean): string {
  if (active) {
    return `border-transparent ${regionFilterActiveClasses[regionId]}`
  }

  return 'border-brand-200 bg-white text-brand-700 hover:border-brand-300 hover:text-brand-500 dark:border-brand-800 dark:bg-brand-900 dark:text-brand-200 dark:hover:border-brand-600 dark:hover:text-brand-300'
}
