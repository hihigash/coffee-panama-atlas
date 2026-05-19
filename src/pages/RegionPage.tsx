import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { FarmCard } from '../components/farm/FarmCard'
import { useFarms } from '../hooks/useFarms'
import { useRegions } from '../hooks/useRegions'

const cardClassName =
  'rounded-2xl border border-brand-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] dark:border-brand-800 dark:bg-brand-900'

export default function RegionPage() {
  const { id } = useParams<{ id: string }>()
  const regions = useRegions()
  const farms = useFarms()

  const region = useMemo(() => regions.find((item) => item.id === id), [id, regions])
  const notableFarms = useMemo(
    () => (region ? farms.filter((farm) => farm.region === region.id) : []),
    [farms, region],
  )

  if (!region) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-light tracking-tight text-brand-800 sm:text-4xl dark:text-white">
          Region not found
        </h1>
        <p className="mt-4 text-brand-700 dark:text-brand-200">
          Try returning to the atlas to browse the listed coffee regions.
        </p>
        <Link
          to="/atlas"
          className="mt-6 inline-flex rounded-full bg-brand-500 px-6 py-3 font-semibold tracking-tight text-white transition-all duration-200 hover:bg-brand-400 active:scale-95"
        >
          Back to Atlas
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl space-y-4">
        <Link
          to="/atlas"
          className="text-sm font-medium text-brand-600 transition hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
        >
          ← Back to Atlas
        </Link>
        <h1 className="font-display text-3xl font-light tracking-tight text-brand-800 sm:text-4xl dark:text-white">
          {region.name}
        </h1>
        <p className="text-lg leading-8 text-brand-600 dark:text-brand-300">{region.description}</p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <section className={cardClassName}>
          <h2 className="text-xl font-semibold text-brand-800 dark:text-white">Climate</h2>
          <p className="mt-4 leading-7 text-brand-600 dark:text-brand-300">{region.climateNotes}</p>
        </section>

        <section className={cardClassName}>
          <h2 className="text-xl font-semibold text-brand-800 dark:text-white">Terroir</h2>
          <ul className="mt-4 space-y-3 text-brand-600 dark:text-brand-300">
            {region.terroir.map((trait) => (
              <li key={trait} className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
                <span>{trait}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-brand-800 dark:text-white">Notable farms</h2>
            <p className="text-brand-600 dark:text-brand-300">
              Producers and estates currently highlighted in this region.
            </p>
          </div>
          <p className="text-sm text-brand-400 dark:text-brand-400">{notableFarms.length} farms listed</p>
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
