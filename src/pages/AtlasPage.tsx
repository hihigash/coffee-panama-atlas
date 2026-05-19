import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { FarmCard } from '../components/farm/FarmCard'
import { getRegionBadgeClassName, getRegionFilterClassName, getRegionName } from '../data/regions'
import { useFarms } from '../hooks/useFarms'
import { useProducerGroups } from '../hooks/useProducerGroups'
import type { RegionId } from '../types/coffee'

const regionFilters: RegionId[] = ['boquete', 'tierras-altas', 'renacimiento']

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
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-white">
          Producer Atlas
        </h1>
        <p className="max-w-3xl text-neutral-600 dark:text-neutral-300">
          Browse Panama&apos;s leading coffee producers, filter by region, and explore the farms that
          define each group&apos;s footprint in the atlas.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            {regionFilters.map((regionId) => {
              const isActive = activeRegions.includes(regionId)

              return (
                <button
                  key={regionId}
                  type="button"
                  onClick={() => toggleRegion(regionId)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${getRegionFilterClassName(regionId, isActive)}`}
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
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-coffee-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-500"
            />
          </label>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
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
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={getRegionBadgeClassName(group.region)}>
                        {getRegionName(group.region)}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatProducerType(group.type)}
                      </span>
                    </div>
                    <Link to={`/producers/${group.slug}`}>
                      <h3 className="text-xl font-semibold text-neutral-900 transition hover:text-coffee-600 dark:text-white dark:hover:text-coffee-300">
                        {group.name}
                      </h3>
                    </Link>
                    {group.principals.length > 0 && (
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {group.principals.join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-medium text-coffee-600 dark:text-coffee-300">
                    {groupFarms.length} farm{groupFarms.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
                  {truncateText(group.description)}
                </p>

                {groupFarms.length > 0 && (
                  <>
                    <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                      Farms: {groupFarms.map((farm) => farm.name).join(', ')}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {groupFarms.map((farm) => (
                        <Link
                          key={farm.id}
                          to={`/farms/${farm.slug}`}
                          className="text-xs rounded-full bg-coffee-50 px-3 py-1 text-coffee-700 transition hover:bg-coffee-100 dark:bg-coffee-900/30 dark:text-coffee-200 dark:hover:bg-coffee-900/50"
                        >
                          {farm.name}
                        </Link>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleGroupExpansion(group.id)}
                      className="mt-5 inline-flex items-center text-sm font-semibold text-coffee-700 transition hover:text-coffee-800 dark:text-coffee-300 dark:hover:text-coffee-200"
                    >
                      {isExpanded ? 'Hide farms ↑' : 'Show farms ↓'}
                    </button>
                    {isExpanded && (
                      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          No producers found
        </div>
      )}
    </section>
  )
}
