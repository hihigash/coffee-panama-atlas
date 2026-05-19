import { Link } from 'react-router-dom'

import { getRegionBadgeClassName, getRegionName } from '../../data/regions'
import type { Farm } from '../../types/atlas'

interface FarmCardProps {
  farm: Farm
}

function formatAltitudeRange(min: number, max: number): string {
  return `${min.toLocaleString()} – ${max.toLocaleString()} MASL`
}

export function FarmCard({ farm }: FarmCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
      {farm.image ? (
        <img src={farm.image} alt={farm.name} className="h-48 w-full object-cover" />
      ) : (
        <div className="flex h-48 items-center justify-center bg-linear-to-br from-coffee-100 via-coffee-200 to-coffee-500 text-5xl text-coffee-900 dark:from-coffee-900 dark:via-coffee-800 dark:to-coffee-600 dark:text-coffee-100">
          ☕
        </div>
      )}

      <div className="space-y-4 p-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={getRegionBadgeClassName(farm.regionId)}>{getRegionName(farm.regionId)}</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">{farm.name}</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{farm.producer}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
          <p>{formatAltitudeRange(farm.altitude.min, farm.altitude.max)}</p>
          <div className="flex flex-wrap gap-2">
            {farm.varieties.slice(0, 3).map((variety) => (
              <span
                key={variety}
                className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {variety}
              </span>
            ))}
          </div>
        </div>

        <Link
          to={`/farms/${farm.slug}`}
          className="inline-flex items-center text-sm font-semibold text-coffee-600 transition hover:text-coffee-700 dark:text-coffee-300 dark:hover:text-coffee-200"
        >
          View farm →
        </Link>
      </div>
    </article>
  )
}
