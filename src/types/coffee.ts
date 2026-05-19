export type PanamaRegionId = 'boquete' | 'tierras-altas' | 'renacimiento'
export type BOPCategory = 'GW' | 'GN' | 'V' | 'PAC'

export type ProcessingMethodId =
  | 'washed'
  | 'natural'
  | 'honey-yellow'
  | 'honey-red'
  | 'honey-black'
  | 'honey-white'
  | 'anaerobic-natural'
  | 'anaerobic-washed'
  | 'double-anaerobic'
  | 'carbonic-maceration'
  | 'extended-fermentation-washed'
  | 'semi-washed'

export type VarietyId =
  | 'gesha'
  | 'catuai-yellow'
  | 'catuai-red'
  | 'caturra'
  | 'typica'
  | 'bourbon-yellow'
  | 'bourbon-red'
  | 'mundo-novo'
  | 'maragogipe'
  | 'pacamara'
  | 'sl28'
  | 'sl34'
  | 'laurina'
  | 'marsellesa'
  | 'obata'
  | 'ethiopia-landrace'
  | 'sidra'
  | 'casiopia'

export type BodyLevel = 'light' | 'light-medium' | 'medium' | 'medium-full' | 'full'
export type QualityPotential = 'medium' | 'medium-high' | 'high' | 'very-high' | 'exceptional'
export type YieldPotential = 'low' | 'medium-low' | 'medium' | 'medium-high' | 'high'

export interface Coordinates {
  lat: number
  lng: number
}

export interface AltitudeRange {
  minMASL: number
  maxMASL: number
}

export interface SocialLinks {
  instagram?: string
  facebook?: string
  twitter?: string
  youtube?: string
}

export interface Farm {
  id: string
  name: string
  slug: string
  producerName: string
  region: PanamaRegionId
  subRegion: string
  coordinates: Coordinates
  altitude: AltitudeRange
  varieties: VarietyId[]
  processingMethods: ProcessingMethodId[]
  farmSizeHa: number | null
  certifications: string[]
  websiteUrl: string | null
  socialLinks: SocialLinks
  scapMember: boolean
  description: string
  farmBlocks: string[]
  imageUrl: string | null
  established: number | null
  auctionLotIds: string[]
}

export interface AuctionLot {
  id: string
  year: number
  category: BOPCategory
  lotNumber: number
  farmId: string
  lotName: string | null
  variety: VarietyId
  processingMethod: ProcessingMethodId
  score: number
  weightLbs: number
  pricePerLbUSD: number
  totalValueUSD: number
  buyers: string[]
  placement: number | null
  altitudeMASL: number | null
  tastingNotes: string[]
}

export interface Region {
  id: PanamaRegionId
  name: string
  description: string
  district: string
  province: string
  center: Coordinates
  altitude: AltitudeRange
  climateClassification: string
  climateNotes: string
  terroir: string[]
  notableFarms: string[]
}

export interface FlavorProfile {
  primaryCategories: string[]
  descriptors: string[]
  body: BodyLevel
  acidity: string
}

export interface Variety {
  id: VarietyId
  name: string
  aliases: string[]
  origin: string
  optimalAltitude: AltitudeRange
  qualityPotential: QualityPotential
  yieldPotential: YieldPotential
  typicalFlavorProfile: FlavorProfile
}

export interface ProcessingMethod {
  id: ProcessingMethodId
  name: string
  parentMethodId: ProcessingMethodId | null
  description: string
  flavorImpact: string
  typicalFlavorNotes: string[]
  variations: string[]
}

export interface RoastDBBean {
  slug: string
  sourceUrl: string
  name: string
  description: string
  roaster: string
  roasterLocation: string
  imageUrl: string | null
  buyUrl: string | null
  price: number | null
  priceCurrency: string | null
  tastingNotes: string[]
  originChain: string[]
  elevation: string | null
  variety: string | null
  processing: string | null
  score: string | null
  awardStatus: string | null
  farmId: string | null
}
