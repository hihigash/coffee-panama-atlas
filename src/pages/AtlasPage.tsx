import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { FarmCard } from '../components/farm/FarmCard'
import { getRegionBadgeClassName, getRegionFilterClassName, getRegionName } from '../data/regions'
import { useFarms } from '../hooks/useFarms'
import { useProducerGroups } from '../hooks/useProducerGroups'
import type { RegionId } from '../types/coffee'

const regionFilters: RegionId[] = ['boquete', 'tierras-altas', 'renacimiento']
const cardClassName =
  'rounded-2xl border border-brand-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] dark:border-brand-800 dark:bg-brand-900'

function formatProducerType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function truncateText(text: string, maxLength = 100): string {
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength).trimEnd()}…`
}

export default function AtlasPage() {
  const farms = useFarms()
  const producerGroups = useProducerGroups()
  const [activeRegions, setActiveRegions] = useState<RegionId[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>([])

  const farmsByProducerGroupId = useMemo(() => {
    const groups = new Map<string, typeof farms>()

    farms.forEach((farm) => {
      const currentFarms = groups.get(farm.producerGroupId) ?? []
      groups.set(farm.producerGroupId, [...currentFarms, farm])
    })

    return groups
  }, [farms])

  const filteredGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return producerGroups.filter((group) => {
      const groupFarms = farmsByProducerGroupId.get(group.id) ?? []
      const matchesRegion = activeRegions.length === 0 || activeRegions.includes(group.region)
      const matchesQuery =
        query.length === 0 ||
        group.name.toLowerCase().includes(query) ||
        group.principals.some((principal) => principal.toLowerCase().includes(query)) ||
        groupFarms.some((farm) => farm.name.toLowerCase().includes(query))

      return matchesRegion && matchesQuery
    })
  }, [activeRegions, farmsByProducerGroupId, producerGroups, searchTerm])

  function toggleRegion(regionId: RegionId) {
    setActiveRegions((current) =>
      current.includes(regionId)
        ? current.filter((selectedRegion) => selectedRegion !== regionId)
        : [...current, regionId],
    )
  }

  function toggleGroupExpansion(groupId: string) {
    setExpandedGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="space-y-4">
        <h1 className="font-display text-4xl font-light tracking-tight text-brand-800 sm:text-5xl dark:text-white">
          Producer Atlas
        </h1>
        <p className="max-w-3xl text-base leading-7 text-brand-700 dark:text-brand-200">
          Browse Panama&apos;s leading coffee producers, filter by region, and explore the farms that
          define each group&apos;s footprint in the atlas.
        </p>
      </div>

      <div className={`mt-10 p-6 ${cardClassName}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            {regionFilters.map((regionId) => {
              const isActive = activeRegions.includes(regionId)

              return (
                <button
                  key={regionId}
                  type="button"
                  onClick={() => toggleRegion(regionId)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition active:scale-95 ${getRegionFilterClassName(regionId, isActive)}`}
                >
                  {getRegionName(regionId)}
                </button>
              )
            })}
          </div>

          <label className="block w-full lg:max-w-sm">
            <span className="sr-only">Search producers</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by producer or farm"
              className="w-full rounded-full border border-brand-200 bg-white px-5 py-3 text-sm text-brand-800 outline-none transition placeholder:text-brand-400 focus:border-brand-400 dark:border-brand-700 dark:bg-brand-950 dark:text-white dark:placeholder:text-brand-400"
            />
          </label>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2 text-sm text-brand-400 sm:flex-row sm:items-center sm:justify-between dark:text-brand-400">
        <p>{filteredGroups.length} producers found</p>
        {activeRegions.length > 0 && <p>Tap a selected region again to clear it.</p>}
      </div>

      {filteredGroups.length > 0 ? (
        <div className="mt-6 space-y-6">
          {filteredGroups.map((group) => {
            const groupFarms = farmsByProducerGroupId.get(group.id) ?? []
            const isExpanded = expandedGroupIds.includes(group.id)

            return (
              <article
                key={group.id}
                className={`${cardClassName} p-6 transition hover:shadow-[0_4px_12px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.06)] sm:p-8`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className={getRegionBadgeClassName(group.region)}>
                        {getRegionName(group.region)}
                      </span>
                      <span className="text-xs uppercase tracking-[0.24em] text-brand-400 dark:text-brand-400">
                        {formatProducerType(group.type)}
                      </span>
                    </div>
                    <Link to={`/producers/${group.slug}`}>
                      <h3 className="font-display text-xl font-semibold text-brand-800 transition hover:text-brand-600 dark:text-white dark:hover:text-brand-300 sm:text-2xl">
                        {group.name}
                      </h3>
                    </Link>
                    {group.principals.length > 0 && (
                      <p className="mt-2 text-sm text-brand-400 dark:text-brand-400">
                        {group.principals.join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-medium text-brand-500 dark:text-brand-300">
                    {groupFarms.length} farm{groupFarms.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-black/80 dark:text-white/80">
                  {truncateText(group.description)}
                </p>

                {groupFarms.length > 0 && (
                  <>
                    <p className="mt-5 text-sm text-brand-400 dark:text-brand-400">
                      Farms: {groupFarms.map((farm) => farm.name).join(', ')}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {groupFarms.map((farm) => (
                        <Link
                          key={farm.id}
                          to={`/farms/${farm.slug}`}
                          className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-100 dark:bg-brand-800 dark:text-brand-200"
                        >
                          {farm.name}
                        </Link>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleGroupExpansion(group.id)}
                      className="mt-5 inline-flex items-center text-sm font-semibold text-brand-600 transition hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
                    >
                      {isExpanded ? 'Hide farms' : 'Show farms'}
                    </button>
                    {isExpanded && (
                      <div className="mt-6 grid gap-6 border-t border-gold-400/30 pt-6 md:grid-cols-2 xl:grid-cols-3">
                        {groupFarms.map((farm) => (
                          <FarmCard key={farm.id} farm={farm} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </article>
            )
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-16 text-center text-brand-700 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] dark:border-brand-800 dark:bg-brand-900 dark:text-brand-200">
          No producers found
        </div>
      )}
    </section>
  )
}
