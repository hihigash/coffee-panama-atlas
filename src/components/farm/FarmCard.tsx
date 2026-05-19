import { Link } from 'react-router-dom'

import { producerGroups } from '../../data/producerGroups'
import { getRegionBadgeClassName, getRegionName } from '../../data/regions'
import type { Farm } from '../../types/coffee'

interface FarmCardProps {
  farm: Farm
}

function formatAltitudeRange(min: number, max: number): string {
  return `${min.toLocaleString()} – ${max.toLocaleString()} MASL`
}

export function FarmCard({ farm }: FarmCardProps) {
  const producerGroup = producerGroups.find((group) => group.id === farm.producerGroupId)

  return (
    <article className="group overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)] dark:border-brand-800 dark:bg-brand-900">
      {farm.imageUrl ? (
        <img src={farm.imageUrl} alt={farm.name} className="h-48 w-full object-cover" />
      ) : (
        <div className="flex h-48 items-center justify-center bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950">
          <span className="font-display text-5xl font-light text-white/20">
            {farm.name.charAt(0)}
          </span>
        </div>
      )}

      <div className="space-y-4 p-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={getRegionBadgeClassName(farm.region)}>{getRegionName(farm.region)}</span>
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold tracking-tight text-brand-800 dark:text-white">
              {farm.name}
            </h3>
            {producerGroup ? (
              <Link
                to={`/producers/${producerGroup.slug}`}
                className="text-sm text-brand-400 transition hover:text-brand-600 dark:text-brand-300 dark:hover:text-brand-200"
              >
                {producerGroup.name}
              </Link>
            ) : (
              <p className="text-sm text-brand-400 dark:text-brand-300">Unknown producer</p>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm text-brand-500 dark:text-brand-300">
          <div className="flex flex-wrap items-center gap-2">
            <p>{formatAltitudeRange(farm.altitude.minMASL, farm.altitude.maxMASL)}</p>
            {farm.blocks.length > 0 && (
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600 dark:bg-brand-800 dark:text-brand-200">
                {farm.blocks.length} {farm.blocks.length === 1 ? 'block' : 'blocks'}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {farm.varieties.slice(0, 3).map((variety) => (
              <span
                key={variety}
                className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-800 dark:text-brand-200"
              >
                {variety}
              </span>
            ))}
          </div>
        </div>

        <Link
          to={`/farms/${farm.slug}`}
          className="inline-flex items-center text-sm font-semibold text-brand-600 transition-colors duration-200 hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
        >
          View farm
          <svg className="ml-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </article>
  )
}
