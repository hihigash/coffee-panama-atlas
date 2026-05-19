import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getRegionBadgeClassName, getRegionName } from '../data/regions'
import { useAuctionLots } from '../hooks/useAuctionLots'
import { useFarms } from '../hooks/useFarms'
import { useProducerGroups } from '../hooks/useProducerGroups'

const cardClassName =
  'rounded-2xl border border-brand-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] dark:border-brand-800 dark:bg-brand-900'
const chipClassName =
  'rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 dark:bg-brand-800 dark:text-brand-200'

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
  const producerGroups = useProducerGroups()

  const farm = useMemo(() => farms.find((item) => item.slug === slug), [farms, slug])
  const producerGroup = useMemo(
    () => producerGroups.find((group) => group.id === farm?.producerGroupId),
    [farm?.producerGroupId, producerGroups],
  )
  const farmLots = useMemo(
    () =>
      farm
        ? auctionLots
            .filter((lot) => lot.farmId === farm.id)
            .sort((left, right) => right.year - left.year)
        : [],
    [auctionLots, farm],
  )

  if (!farm) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-light tracking-tight text-brand-800 sm:text-4xl dark:text-white">
          Farm not found
        </h1>
        <p className="mt-4 text-brand-700 dark:text-brand-200">
          The farm you are looking for is not currently listed in the atlas.
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

  const details = [
    { label: 'Region', value: getRegionName(farm.region), href: null },
    { label: 'Sub-region', value: farm.subRegion, href: null },
    {
      label: 'Altitude',
      value: formatAltitudeRange(farm.altitude.minMASL, farm.altitude.maxMASL),
      href: null,
    },
    {
      label: 'Farm size',
      value: farm.farmSizeHa === null ? 'Unknown' : `${farm.farmSizeHa} hectares`,
      href: null,
    },
    {
      label: 'Established',
      value: farm.established === null ? 'Unknown' : farm.established.toString(),
      href: null,
    },
    {
      label: 'Website',
      value: producerGroup?.websiteUrl ?? 'Not available',
      href: producerGroup?.websiteUrl ?? null,
    },
  ]

  return (
    <div>
      <section className="border-b border-gold-400/20 bg-brand-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Link to="/atlas" className="text-sm font-medium text-brand-300 transition hover:text-brand-200">
            ← Back to Atlas
          </Link>
          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <span className={getRegionBadgeClassName(farm.region)}>{getRegionName(farm.region)}</span>
              <div className="space-y-2">
                {producerGroup && (
                  <Link
                    to={`/producers/${producerGroup.slug}`}
                    className="text-sm font-medium text-gold-400 transition hover:text-gold-300"
                  >
                    {producerGroup.name}
                  </Link>
                )}
                <h1 className="font-display text-3xl font-light tracking-tight text-white sm:text-4xl">
                  {farm.name}
                </h1>
              </div>
            </div>
            <Link
              to={`/regions/${farm.region}`}
              className="text-sm font-semibold text-brand-300 transition hover:text-brand-200"
            >
              View region →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {details.map((item) => (
            <div key={item.label} className={cardClassName}>
              <p className="text-xs uppercase tracking-[0.24em] text-brand-400 dark:text-brand-400">
                {item.label}
              </p>
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block text-base font-semibold text-brand-600 transition hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
                >
                  {item.value}
                </a>
              ) : (
                <p className="mt-4 text-base font-semibold text-brand-800 dark:text-white">{item.value}</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className={cardClassName}>
            <h2 className="text-xl font-semibold text-brand-800 dark:text-white">Varieties</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {farm.varieties.map((variety) => (
                <span key={variety} className={chipClassName}>
                  {variety}
                </span>
              ))}
            </div>
          </section>

          <section className={cardClassName}>
            <h2 className="text-xl font-semibold text-brand-800 dark:text-white">Processing methods</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {farm.processingMethods.map((method) => (
                <span key={method} className={chipClassName}>
                  {method}
                </span>
              ))}
            </div>
          </section>
        </div>

        {farm.description && (
          <section className={cardClassName}>
            <h2 className="text-xl font-semibold text-brand-800 dark:text-white">About</h2>
            <p className="mt-4 leading-7 text-brand-700 dark:text-brand-200">{farm.description}</p>
          </section>
        )}

        {farm.cupCharacter && (
          <section className={cardClassName}>
            <h2 className="text-xl font-semibold text-brand-800 dark:text-white">Cup Character</h2>
            <p className="mt-4 leading-7 italic text-brand-600 dark:text-brand-300">
              {farm.cupCharacter}
            </p>
          </section>
        )}

        {farm.blocks.length > 0 && (
          <section className={cardClassName}>
            <h2 className="text-xl font-semibold text-brand-800 dark:text-white">Farm Blocks</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {farm.blocks.map((block) => (
                <div
                  key={block.name}
                  className="rounded-2xl border border-brand-100 bg-brand-50 p-5 dark:border-brand-700 dark:bg-brand-800"
                >
                  <h3 className="text-lg font-semibold text-brand-800 dark:text-white">{block.name}</h3>
                  {block.altitude && (
                    <p className="mt-1 text-sm text-brand-700 dark:text-brand-200">
                      {formatAltitudeRange(block.altitude.minMASL, block.altitude.maxMASL)}
                    </p>
                  )}
                  {block.varieties.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {block.varieties.map((variety) => (
                        <span key={variety} className={chipClassName}>
                          {variety}
                        </span>
                      ))}
                    </div>
                  )}
                  {block.notes && (
                    <p className="mt-3 text-xs leading-6 text-brand-400 dark:text-brand-300">{block.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className={cardClassName}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-brand-800 dark:text-white">BOP Auction History</h2>
            <p className="text-sm text-brand-400 dark:text-brand-400">
              Best of Panama selections linked to this farm.
            </p>
          </div>

          {farmLots.length > 0 ? (
            <div className="mt-6 overflow-x-auto border-t border-gold-400/30 pt-4">
              <table className="min-w-full divide-y divide-brand-100 text-left text-sm dark:divide-brand-800">
                <thead>
                  <tr className="text-brand-400 dark:text-brand-400">
                    <th className="py-3 pr-4 font-medium">Year</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Lot</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="py-3 pl-4 font-medium">Buyer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100 dark:divide-brand-800">
                  {farmLots.map((lot) => (
                    <tr key={lot.id} className="text-brand-700 dark:text-brand-200">
                      <td className="py-4 pr-4 font-semibold text-brand-800 dark:text-white">{lot.year}</td>
                      <td className="px-4 py-4">{lot.category}</td>
                      <td className="px-4 py-4">{lot.lot}</td>
                      <td
                        className={`px-4 py-4 ${lot.score > 90 ? 'font-semibold text-gold-600 dark:text-gold-400' : ''}`}
                      >
                        {lot.score.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-gold-600 dark:text-gold-400">
                        {formatPrice(lot.priceUsdPerKg)}
                      </td>
                      <td className="py-4 pl-4">{lot.buyer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-6 text-brand-700 dark:text-brand-200">
              No auction lots have been listed for this farm yet.
            </p>
          )}
        </section>
      </section>
    </div>
  )
}
