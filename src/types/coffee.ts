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

export type RegionId = PanamaRegionId

export type ProducerGroupType = 'family' | 'company' | 'individual' | 'cooperative'

export interface ProducerGroup {
  id: string
  name: string
  slug: string
  type: ProducerGroupType
  principals: string[]
  description: string
  region: PanamaRegionId
  websiteUrl: string | null
  socialLinks: SocialLinks
  email: string | null
  phone: string | null
  scapMember: boolean
  scapProfileUrl: string
  imageUrl: string | null
  established: number | null
  farmIds: string[]
}

export interface FarmBlock {
  name: string
  altitude: AltitudeRange | null
  varieties: string[]
  notes: string | null
}

export interface Farm {
  id: string
  name: string
  slug: string
  producerGroupId: string
  region: PanamaRegionId
  subRegion: string
  coordinates: Coordinates
  altitude: AltitudeRange
  varieties: string[]
  processingMethods: string[]
  farmSizeHa: number | null
  certifications: string[]
  description: string
  blocks: FarmBlock[]
  imageUrl: string | null
  established: number | null
  cupCharacter: string | null
  auctionLotIds: string[]
}

export interface AuctionLot {
  id: string
  farmId: string
  year: number
  category: string
  lot: string
  score: number
  priceUsdPerKg: number
  buyer: string
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
