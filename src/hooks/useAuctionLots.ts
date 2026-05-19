import { auctionLots } from '../data/auctionLots'
import type { AuctionLot } from '../types/atlas'

export function useAuctionLots(): AuctionLot[] {
  return auctionLots
}
