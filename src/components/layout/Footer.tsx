export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-neutral-600 sm:px-6 lg:px-8 dark:text-neutral-400">
        <p className="font-semibold text-coffee-800 dark:text-coffee-200">Panama Coffee Atlas</p>
        <p>Data from SCAP Panama, Best of Panama, and RoastDB</p>
        <p>© {currentYear} Panama Coffee Atlas</p>
      </div>
    </footer>
  )
}
