import { Link } from 'react-router-dom'

const stats = [
  { label: 'Farms', value: '54+' },
  { label: 'Regions', value: '3' },
  { label: 'Varieties', value: '18+' },
  { label: 'Record Price', value: '$10,005/kg' },
] as const

export default function HomePage() {
  return (
    <div>
      <section className="bg-coffee-50 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex rounded-full bg-white px-4 py-1 text-sm font-medium text-coffee-700 shadow-sm dark:bg-neutral-800 dark:text-coffee-200">
              Specialty coffee origin atlas
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-coffee-900 sm:text-4xl lg:text-5xl dark:text-white">
              Panama Coffee Atlas
            </h1>
            <p className="text-base leading-8 text-neutral-700 sm:text-lg dark:text-neutral-300">
              Explore the world&apos;s most prestigious coffee origin — from Boquete to Volcán,
              discover the farms, varieties, and auction history that make Panama coffee legendary.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/atlas"
                className="inline-flex items-center rounded-xl bg-coffee-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-coffee-700"
              >
                Explore the Atlas
              </Link>
              <Link
                to="/map"
                className="inline-flex items-center rounded-xl border border-coffee-300 bg-white px-5 py-3 font-semibold text-coffee-700 transition hover:border-coffee-400 hover:bg-coffee-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-coffee-200 dark:hover:bg-neutral-700"
              >
                View Map
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <p className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {stat.label}
              </p>
              <p className="mt-3 text-xl font-bold text-coffee-700 sm:text-2xl dark:text-coffee-200">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
