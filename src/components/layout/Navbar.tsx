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
    'px-3 py-2 text-sm font-medium tracking-wide uppercase transition-colors duration-200',
    isActive
      ? 'text-gold-400'
      : 'text-white/70 hover:text-white',
  ].join(' ')
}

export function Navbar() {
  const location = useLocation()

  usePreline([location.pathname])

  return (
    <header className="sticky top-0 z-50 bg-brand-950/95 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.1)]">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="font-display text-xl font-semibold tracking-tight text-gold-400 transition hover:text-gold-300 sm:text-2xl"
        >
          Panama Coffee Atlas
        </Link>

        <div className="flex items-center gap-2 md:order-2">
          <button
            type="button"
            className="hs-dark-mode inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/60 transition hover:border-white/40 hover:text-white dark:hidden"
            data-hs-theme-click-value="dark"
            aria-label="Enable dark mode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </svg>
          </button>
          <button
            type="button"
            className="hs-dark-mode hidden h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/60 transition hover:border-white/40 hover:text-white dark:inline-flex"
            data-hs-theme-click-value="light"
            aria-label="Enable light mode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>
          </button>
          <button
            type="button"
            className="hs-collapse-toggle inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/60 transition hover:border-white/40 hover:text-white md:hidden"
            id="navbar-collapse-toggle"
            aria-expanded="false"
            aria-controls="navbar-collapse"
            data-hs-collapse="#navbar-collapse"
            role="region"
          >
            <span className="sr-only">Toggle navigation</span>
            <svg
              className="h-4 w-4"
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
          <div className="mt-4 flex flex-col gap-1 border-t border-white/10 pt-4 md:mt-0 md:flex-row md:items-center md:justify-end md:border-t-0 md:pt-0">
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
