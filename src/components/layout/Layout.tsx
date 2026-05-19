import { Outlet } from 'react-router-dom'

import { Footer } from './Footer'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
