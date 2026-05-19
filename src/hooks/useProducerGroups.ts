import { producerGroups } from '../data/producerGroups'
import type { ProducerGroup } from '../types/coffee'

export function useProducerGroups(): ProducerGroup[] {
  return producerGroups
}
