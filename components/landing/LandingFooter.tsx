import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="border-t border-[rgb(var(--zw-border2))] bg-[rgb(var(--zw-page))] py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[rgb(var(--zw-elev))] text-[rgb(var(--zw-brand))] font-bold text-xs" aria-hidden="true">ZW</div>
            <span className="text-sm text-[rgb(var(--zw-ink2))]">ZoneWise.AI — by Everest Capital USA</span>
          </div>
          <nav aria-label="Footer navigation">
            <div className="flex items-center gap-1 text-sm text-[rgb(var(--zw-ink2))]">
              <Link href="/privacy" className="px-3 py-2 hover:text-[rgb(var(--zw-ink))] transition-colors rounded min-h-[44px] flex items-center">Privacy</Link>
              <Link href="/terms" className="px-3 py-2 hover:text-[rgb(var(--zw-ink))] transition-colors rounded min-h-[44px] flex items-center">Terms</Link>
              <Link href="/disclaimer" className="px-3 py-2 hover:text-[rgb(var(--zw-ink))] transition-colors rounded min-h-[44px] flex items-center">Disclaimer</Link>
              <Link href="/docs" className="px-3 py-2 hover:text-[rgb(var(--zw-ink))] transition-colors rounded min-h-[44px] flex items-center">Docs</Link>
            </div>
          </nav>
          <p className="text-xs text-[rgb(var(--zw-ink2))]">© 2026 Everest Capital USA LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
