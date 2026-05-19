import farmsData from '../data/farms.json'
import auctionLotsData from '../data/auction-lots.json'
import regionsData from '../data/regions.json'
import varietiesData from '../data/varieties.json'
import processingMethodsData from '../data/processing-methods.json'
import roastdbBeansData from '../data/roastdb-beans.json'
import type {
  Farm,
  AuctionLot,
  Region,
  Variety,
  ProcessingMethod,
  RoastDBBean,
} from '../types/coffee'

export function useFarms() {
  return farmsData as Farm[]
}

export function useAuctionLots() {
  return auctionLotsData as AuctionLot[]
}

export function useRegions() {
  return regionsData as Region[]
}

export function useVarieties() {
  return varietiesData as Variety[]
}

export function useProcessingMethods() {
  return processingMethodsData as ProcessingMethod[]
}

export function useRoastDBBeans() {
  return roastdbBeansData as RoastDBBean[]
}
