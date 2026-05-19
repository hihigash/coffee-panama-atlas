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

const cardClassName =
  'rounded-2xl border border-brand-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] dark:border-brand-800 dark:bg-brand-900'

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
        <h1 className="font-display text-3xl font-light tracking-tight text-brand-800 sm:text-4xl dark:text-white">
          Producer not found
        </h1>
        <p className="mt-4 text-brand-700 dark:text-brand-200">
          The producer group you are looking for is not currently listed in the atlas.
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

  const socialEntries = Object.entries(producerGroup.socialLinks).filter(
    (entry): entry is [string, string] => Boolean(entry[1]),
  )
  const hasContactInfo =
    producerGroup.email !== null || producerGroup.phone !== null || socialEntries.length > 0

  return (
    <div>
      <section className="border-b border-gold-400/20 bg-brand-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Link
            to="/atlas"
            className="text-sm font-medium text-brand-300 transition hover:text-brand-200"
          >
            ← Back to Atlas
          </Link>

          <div className="mt-8 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-950">
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
                  className="inline-flex items-center rounded-full bg-gold-400/20 px-3 py-1 text-xs font-semibold text-gold-400 transition hover:bg-gold-400/30 dark:bg-gold-400/20 dark:text-gold-300"
                >
                  SCAP Member
                </a>
              )}
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-4xl font-light tracking-tight text-white sm:text-5xl">
                {producerGroup.name}
              </h1>
              {producerGroup.principals.length > 0 && (
                <p className="text-lg text-white/60">Led by {producerGroup.principals.join(', ')}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
              <span className="text-brand-300">
                {producerFarms.length} farm{producerFarms.length !== 1 ? 's' : ''} in the atlas
              </span>
              {producerGroup.established !== null && <span>Established {producerGroup.established}</span>}
              {producerGroup.websiteUrl && (
                <a
                  href={producerGroup.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brand-300 transition hover:text-brand-200"
                >
                  {getWebsiteLabel(producerGroup.websiteUrl)}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-10 px-4 py-16 sm:px-6 lg:px-8">
        <section className={cardClassName}>
          <h2 className="text-xl font-semibold text-brand-800 dark:text-white">About</h2>
          <p className="mt-4 border-t border-gold-400/30 pt-4 leading-7 text-brand-700 dark:text-brand-200">
            {producerGroup.description}
          </p>
        </section>

        <section className={cardClassName}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-brand-800 dark:text-white">Farms & Estates</h2>
              <p className="mt-1 text-sm text-brand-400 dark:text-brand-400">
                {producerFarms.length} farm{producerFarms.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {producerFarms.length > 0 ? (
            <div className="mt-6 grid gap-6 border-t border-gold-400/30 pt-6 md:grid-cols-2 lg:grid-cols-3">
              {producerFarms.map((farm) => (
                <FarmCard key={farm.id} farm={farm} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-12 text-center text-brand-700 dark:border-brand-800 dark:bg-brand-900 dark:text-brand-200">
              No farms are currently listed for this producer.
            </div>
          )}
        </section>

        {hasContactInfo && (
          <section className={cardClassName}>
            <h2 className="text-xl font-semibold text-brand-800 dark:text-white">Contact</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {producerGroup.email && (
                <div className="rounded-2xl bg-brand-50 p-4 dark:bg-brand-950">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-400 dark:text-brand-400">
                    Email
                  </p>
                  <a
                    href={`mailto:${producerGroup.email}`}
                    className="mt-2 block font-semibold text-brand-600 transition hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
                  >
                    {producerGroup.email}
                  </a>
                </div>
              )}

              {producerGroup.phone && (
                <div className="rounded-2xl bg-brand-50 p-4 dark:bg-brand-950">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-400 dark:text-brand-400">
                    Phone
                  </p>
                  <a
                    href={`tel:${producerGroup.phone}`}
                    className="mt-2 block font-semibold text-brand-600 transition hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
                  >
                    {producerGroup.phone}
                  </a>
                </div>
              )}

              {socialEntries.map(([platform, value]) => (
                <div key={platform} className="rounded-2xl bg-brand-50 p-4 dark:bg-brand-950">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-400 dark:text-brand-400">
                    {socialLabels[platform] ?? platform}
                  </p>
                  <a
                    href={getSocialHref(platform, value)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block font-semibold text-brand-600 transition hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
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
