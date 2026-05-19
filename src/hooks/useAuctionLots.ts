import { auctionLots } from '../data/auctionLots'
import type { AuctionLot } from '../types/coffee'

export function useAuctionLots(): AuctionLot[] {
  return auctionLots
}
