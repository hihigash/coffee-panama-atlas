import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { FarmCard } from '../components/farm/FarmCard'
import { useFarms } from '../hooks/useFarms'
import { useRegions } from '../hooks/useRegions'

export default function RegionPage() {
  const { id } = useParams<{ id: string }>()
  const regions = useRegions()
  const farms = useFarms()

  const region = useMemo(() => regions.find((item) => item.id === id), [id, regions])
  const notableFarms = useMemo(
    () => (region ? farms.filter((farm) => farm.regionId === region.id) : []),
    [farms, region],
  )

  if (!region) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-white">Region not found</h1>
        <p className="mt-4 text-neutral-600 dark:text-neutral-300">
          Try returning to the atlas to browse the listed coffee regions.
        </p>
        <Link
          to="/atlas"
          className="mt-6 inline-flex rounded-xl bg-coffee-600 px-5 py-3 font-semibold text-white transition hover:bg-coffee-700"
        >
          Back to Atlas
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-3xl space-y-4">
        <Link
          to="/atlas"
          className="text-sm font-medium text-coffee-700 transition hover:text-coffee-800 dark:text-coffee-300 dark:hover:text-coffee-200"
        >
          ← Back to Atlas
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
          {region.name}
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-300">{region.description}</p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Climate</h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-300">{region.climate}</p>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Terroir</h2>
          <ul className="mt-4 space-y-3 text-neutral-600 dark:text-neutral-300">
            {region.terroir.map((trait) => (
              <li key={trait} className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-coffee-500" />
                <span>{trait}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Notable farms</h2>
            <p className="text-neutral-600 dark:text-neutral-300">
              Producers and estates currently highlighted in this region.
            </p>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {notableFarms.length} farms listed
          </p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {notableFarms.map((farm) => (
            <FarmCard key={farm.id} farm={farm} />
          ))}
        </div>
      </section>
    </section>
  )
}
