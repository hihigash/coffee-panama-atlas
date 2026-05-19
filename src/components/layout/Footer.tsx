export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-brand-800 bg-brand-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 sm:px-6 lg:px-8">
        <p className="font-display text-lg font-semibold tracking-tight text-gold-400">
          Panama Coffee Atlas
        </p>
        <p className="text-sm text-white/50">
          Data sourced from SCAP Panama, Best of Panama, and public records.
        </p>
        <div className="mt-2 border-t border-white/10 pt-4">
          <p className="text-xs text-white/40">© {currentYear} Panama Coffee Atlas</p>
        </div>
      </div>
    </footer>
  )
}
