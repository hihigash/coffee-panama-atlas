import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { FarmCard } from '../components/farm/FarmCard'
import { getRegionBadgeClassName, getRegionName } from '../data/regions'
import { useFarms } from '../hooks/useFarms'
import { useProducerGroups } from '../hooks/useProducerGroups'

const socialLabels: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter',
  youtube: 'YouTube',
}

function formatProducerType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function getWebsiteLabel(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function getSocialHref(platform: string, value: string): string {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  const handle = value.replace(/^@/, '')

  switch (platform) {
    case 'instagram':
      return `https://www.instagram.com/${handle}`
    case 'facebook':
      return `https://www.facebook.com/${handle}`
    case 'twitter':
      return `https://twitter.com/${handle}`
    case 'youtube':
      return `https://www.youtube.com/${handle}`
    default:
      return value
  }
}

export default function ProducerGroupPage() {
  const { slug } = useParams<{ slug: string }>()
  const farms = useFarms()
  const producerGroups = useProducerGroups()

  const producerGroup = useMemo(
    () => producerGroups.find((group) => group.slug === slug),
    [producerGroups, slug],
  )
  const producerFarms = useMemo(
    () => (producerGroup ? farms.filter((farm) => farm.producerGroupId === producerGroup.id) : []),
    [farms, producerGroup],
  )

  if (!producerGroup) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-white">
          Producer not found
        </h1>
        <p className="mt-4 text-neutral-600 dark:text-neutral-300">
          The producer group you are looking for is not currently listed in the atlas.
        </p>
        <Link
          to="/atlas"
          className="mt-6 inline-flex rounded-xl bg-coffee-600 px-5 py-3 font-semibold text-white transition hover:bg-coffee-700"
        >
          ← Back to Atlas
        </Link>
      </section>
    )
  }

  const socialEntries = Object.entries(producerGroup.socialLinks).filter(
    (entry): entry is [string, string] => Boolean(entry[1]),
  )
  const hasContactInfo =
    producerGroup.email !== null || producerGroup.phone !== null || socialEntries.length > 0

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

          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-neutral-900">
                {formatProducerType(producerGroup.type)}
              </span>
              <span className={getRegionBadgeClassName(producerGroup.region)}>
                {getRegionName(producerGroup.region)}
              </span>
              {producerGroup.scapMember && (
                <a
                  href={producerGroup.scapProfileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-coffee-100 px-3 py-1 text-xs font-semibold text-coffee-800 transition hover:bg-coffee-200 dark:bg-coffee-900/40 dark:text-coffee-100 dark:hover:bg-coffee-900/60"
                >
                  SCAP Member
                </a>
              )}
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
                {producerGroup.name}
              </h1>
              {producerGroup.principals.length > 0 && (
                <p className="text-lg text-neutral-600 dark:text-neutral-300">
                  Led by {producerGroup.principals.join(', ')}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300">
              <span>
                {producerFarms.length} farm{producerFarms.length !== 1 ? 's' : ''} in the atlas
              </span>
              {producerGroup.established !== null && <span>Established {producerGroup.established}</span>}
              {producerGroup.websiteUrl && (
                <a
                  href={producerGroup.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-coffee-700 transition hover:text-coffee-800 dark:text-coffee-300 dark:hover:text-coffee-200"
                >
                  {getWebsiteLabel(producerGroup.websiteUrl)}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">About</h2>
          <p className="mt-4 leading-7 text-neutral-600 dark:text-neutral-300">
            {producerGroup.description}
          </p>
        </section>

        <section>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                Farms & Estates
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {producerFarms.length} farm{producerFarms.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {producerFarms.length > 0 ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {producerFarms.map((farm) => (
                <FarmCard key={farm.id} farm={farm} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
              No farms are currently listed for this producer.
            </div>
          )}
        </section>

        {hasContactInfo && (
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Contact</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {producerGroup.email && (
                <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-950">
                  <p className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Email
                  </p>
                  <a
                    href={`mailto:${producerGroup.email}`}
                    className="mt-2 block font-semibold text-coffee-700 transition hover:text-coffee-800 dark:text-coffee-300 dark:hover:text-coffee-200"
                  >
                    {producerGroup.email}
                  </a>
                </div>
              )}

              {producerGroup.phone && (
                <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-950">
                  <p className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Phone
                  </p>
                  <a
                    href={`tel:${producerGroup.phone}`}
                    className="mt-2 block font-semibold text-neutral-900 dark:text-white"
                  >
                    {producerGroup.phone}
                  </a>
                </div>
              )}

              {socialEntries.map(([platform, value]) => (
                <div key={platform} className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-950">
                  <p className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    {socialLabels[platform] ?? platform}
                  </p>
                  <a
                    href={getSocialHref(platform, value)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block font-semibold text-coffee-700 transition hover:text-coffee-800 dark:text-coffee-300 dark:hover:text-coffee-200"
                  >
                    {value}
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  )
}
