import { Link } from 'react-router-dom'

import { useFarms } from '../hooks/useFarms'
import { useProducerGroups } from '../hooks/useProducerGroups'

export default function HomePage() {
  const farms = useFarms()
  const producerGroups = useProducerGroups()

  const stats = [
    { label: 'Producers', value: producerGroups.length.toString() },
    { label: 'Farms', value: farms.length.toString() },
    { label: 'Regions', value: '3' },
    { label: 'Record Price', value: '$30,204/kg', highlight: true },
  ] as const

  return (
    <div className="bg-[#F2F0EB] dark:bg-brand-950">
      <section className="bg-brand-950">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="max-w-3xl space-y-8">
            <p className="text-sm font-medium uppercase tracking-widest text-gold-400">
              Specialty Coffee Origin Atlas
            </p>
            <h1 className="font-display text-4xl font-light leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Panama Coffee Atlas
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-white/60">
              Explore the world&apos;s most prestigious coffee origin — from Boquete
              to Volcán, discover the farms, varieties, and auction history that make
              Panama coffee legendary.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to="/atlas"
                className="inline-flex items-center rounded-full bg-brand-500 px-7 py-3.5 text-sm font-semibold tracking-tight text-white shadow-sm transition-all duration-200 hover:bg-brand-400 active:scale-95"
              >
                Explore the Atlas
              </Link>
              <Link
                to="/map"
                className="inline-flex items-center rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold tracking-tight text-white transition-all duration-200 hover:border-white/60 hover:bg-white/5 active:scale-95"
              >
                View Map
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative rounded-2xl border border-brand-100 bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] dark:border-brand-800 dark:bg-brand-900"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
              <p className="text-xs font-medium uppercase tracking-widest text-brand-400 dark:text-brand-300">
                {stat.label}
              </p>
              <p
                className={`mt-4 font-display text-3xl font-semibold tracking-tight ${
                  'highlight' in stat && stat.highlight
                    ? 'text-gold-500 dark:text-gold-400'
                    : 'text-brand-600 dark:text-brand-200'
                }`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
