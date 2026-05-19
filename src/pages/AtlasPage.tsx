import { useMemo, useState } from 'react'

import { FarmCard } from '../components/farm/FarmCard'
import { getRegionFilterClassName, getRegionName } from '../data/regions'
import { useFarms } from '../hooks/useFarms'
import type { RegionId } from '../types/atlas'

const regionFilters: RegionId[] = ['boquete', 'tierras-altas', 'renacimiento']

export default function AtlasPage() {
  const farms = useFarms()
  const [activeRegions, setActiveRegions] = useState<RegionId[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const filteredFarms = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return farms.filter((farm) => {
      const matchesRegion =
        activeRegions.length === 0 || activeRegions.includes(farm.regionId)
      const matchesQuery =
        query.length === 0 ||
        farm.name.toLowerCase().includes(query) ||
        farm.producer.toLowerCase().includes(query)

      return matchesRegion && matchesQuery
    })
  }, [activeRegions, farms, searchTerm])

  function toggleRegion(regionId: RegionId) {
    setActiveRegions((current) =>
      current.includes(regionId)
        ? current.filter((selectedRegion) => selectedRegion !== regionId)
        : [...current, regionId],
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-white">Farm Atlas</h1>
        <p className="max-w-3xl text-neutral-600 dark:text-neutral-300">
          Browse acclaimed Panama farms, filter by region, and compare producers shaping the
          country&apos;s modern coffee reputation.
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
            <span className="sr-only">Search farms</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by farm or producer"
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-coffee-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-500"
            />
          </label>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
        <p>{filteredFarms.length} farms found</p>
        {activeRegions.length > 0 && <p>Tap a selected region again to clear it.</p>}
      </div>

      {filteredFarms.length > 0 ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredFarms.map((farm) => (
            <FarmCard key={farm.id} farm={farm} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          No farms found
        </div>
      )}
    </section>
  )
}
