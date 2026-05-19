import { Link, NavLink, useLocation } from 'react-router-dom'

import { usePreline } from '../../hooks/usePreline'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

const navItems: NavItem[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/atlas', label: 'Atlas' },
  { to: '/map', label: 'Map' },
]

function getNavLinkClassName(isActive: boolean): string {
  return [
    'rounded-lg px-3 py-2 text-sm transition-colors',
    isActive
      ? 'font-semibold text-coffee-600 dark:text-coffee-300'
      : 'text-neutral-700 hover:text-coffee-600 dark:text-neutral-200 dark:hover:text-coffee-300',
  ].join(' ')
}

export function Navbar() {
  const location = useLocation()

  usePreline([location.pathname])

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="text-base font-semibold tracking-tight text-coffee-800 transition hover:text-coffee-600 dark:text-coffee-100 dark:hover:text-coffee-300"
        >
          ☕ Panama Coffee Atlas
        </Link>

        <div className="flex items-center gap-2 md:order-2">
          <button
            type="button"
            className="hs-dark-mode inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-lg text-coffee-700 shadow-sm transition hover:bg-coffee-50 dark:hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-coffee-300"
            data-hs-theme-click-value="dark"
            aria-label="Enable dark mode"
          >
            🌙
          </button>
          <button
            type="button"
            className="hs-dark-mode hidden h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-lg text-coffee-200 shadow-sm transition hover:bg-neutral-700 dark:inline-flex"
            data-hs-theme-click-value="light"
            aria-label="Enable light mode"
          >
            ☀️
          </button>
          <button
            type="button"
            className="hs-collapse-toggle inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 transition hover:bg-coffee-50 md:hidden dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            id="navbar-collapse-toggle"
            aria-expanded="false"
            aria-controls="navbar-collapse"
            data-hs-collapse="#navbar-collapse"
            role="region"
          >
            <span className="sr-only">Toggle navigation</span>
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>

        <div
          id="navbar-collapse"
          className="hs-collapse hidden basis-full grow overflow-hidden transition-[height] duration-300 md:order-1 md:block md:basis-auto"
          aria-labelledby="navbar-collapse-toggle"
        >
          <div className="mt-4 flex flex-col gap-2 border-t border-neutral-200 pt-4 md:mt-0 md:flex-row md:items-center md:justify-end md:border-t-0 md:pt-0 dark:border-neutral-800">
            {navItems.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => getNavLinkClassName(isActive)}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </header>
  )
}
