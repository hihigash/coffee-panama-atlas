export type RegionId = 'boquete' | 'tierras-altas' | 'renacimiento'

export interface Region {
  id: RegionId
  name: string
  description: string
  climate: string
  terroir: string[]
}

export interface Farm {
  id: string
  slug: string
  name: string
  producer: string
  regionId: RegionId
  subRegion: string
  altitude: {
    min: number
    max: number
  }
  farmSizeHectares: number
  establishedYear: number
  website?: string
  coordinates: {
    lat: number
    lng: number
  }
  varieties: string[]
  processingMethods: string[]
  image?: string
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
