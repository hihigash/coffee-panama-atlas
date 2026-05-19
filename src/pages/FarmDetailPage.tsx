import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getRegionBadgeClassName, getRegionName } from '../data/regions'
import { useAuctionLots } from '../hooks/useAuctionLots'
import { useFarms } from '../hooks/useFarms'

function formatAltitudeRange(min: number, max: number): string {
  return `${min.toLocaleString()} – ${max.toLocaleString()} MASL`
}

function formatPrice(priceUsdPerKg: number): string {
  return `$${priceUsdPerKg.toLocaleString()}/kg`
}

export default function FarmDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const farms = useFarms()
  const auctionLots = useAuctionLots()

  const farm = useMemo(() => farms.find((item) => item.slug === slug), [farms, slug])
  const farmLots = useMemo(
    () =>
      (farm
        ? auctionLots
            .filter((lot) => lot.farmId === farm.id)
            .sort((left, right) => right.year - left.year)
        : []),
    [auctionLots, farm],
  )

  if (!farm) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-white">Farm not found</h1>
        <p className="mt-4 text-neutral-600 dark:text-neutral-300">
          The farm you are looking for is not currently listed in the atlas.
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
    <div>
      <section className="bg-coffee-50 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            to="/atlas"
            className="text-sm font-medium text-coffee-700 transition hover:text-coffee-800 dark:text-coffee-300 dark:hover:text-coffee-200"
          >
            ← Back to Atlas
          </Link>
          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className={getRegionBadgeClassName(farm.regionId)}>{getRegionName(farm.regionId)}</span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
                  {farm.name}
                </h1>
                <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-300">
                  {farm.producer}
                </p>
              </div>
            </div>
            <Link
              to={`/regions/${farm.regionId}`}
              className="text-sm font-semibold text-coffee-700 transition hover:text-coffee-800 dark:text-coffee-300 dark:hover:text-coffee-200"
            >
              View region →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Region', value: getRegionName(farm.regionId) },
            { label: 'Sub-region', value: farm.subRegion },
            { label: 'Altitude', value: formatAltitudeRange(farm.altitude.min, farm.altitude.max) },
            { label: 'Farm size', value: `${farm.farmSizeHectares} hectares` },
            { label: 'Established', value: farm.establishedYear.toString() },
            { label: 'Website', value: farm.website ?? 'Not available' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <p className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {item.label}
              </p>
              {item.label === 'Website' && farm.website ? (
                <a
                  href={farm.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block font-semibold text-coffee-700 transition hover:text-coffee-800 dark:text-coffee-300 dark:hover:text-coffee-200"
                >
                  {farm.website}
                </a>
              ) : (
                <p className="mt-3 text-base font-semibold text-neutral-900 dark:text-white">
                  {item.value}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Varieties</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {farm.varieties.map((variety) => (
                <span
                  key={variety}
                  className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                >
                  {variety}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Processing methods
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {farm.processingMethods.map((method) => (
                <span
                  key={method}
                  className="rounded-full bg-coffee-50 px-3 py-1 text-sm text-coffee-800 dark:bg-coffee-900/40 dark:text-coffee-100"
                >
                  {method}
                </span>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              BOP Auction History
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Best of Panama selections linked to this farm.
            </p>
          </div>

          {farmLots.length > 0 ? (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-left text-sm dark:divide-neutral-800">
                <thead>
                  <tr className="text-neutral-500 dark:text-neutral-400">
                    <th className="py-3 pr-4 font-medium">Year</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Lot</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="pl-4 py-3 font-medium">Buyer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {farmLots.map((lot) => (
                    <tr key={lot.id} className="text-neutral-700 dark:text-neutral-200">
                      <td className="py-4 pr-4 font-semibold">{lot.year}</td>
                      <td className="px-4 py-4">{lot.category}</td>
                      <td className="px-4 py-4">{lot.lot}</td>
                      <td className="px-4 py-4">{lot.score.toFixed(2)}</td>
                      <td className="px-4 py-4 font-semibold text-coffee-700 dark:text-coffee-300">
                        {formatPrice(lot.priceUsdPerKg)}
                      </td>
                      <td className="pl-4 py-4">{lot.buyer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-6 text-neutral-600 dark:text-neutral-300">
              No auction lots have been listed for this farm yet.
            </p>
          )}
        </section>
      </section>
    </div>
  )
}
