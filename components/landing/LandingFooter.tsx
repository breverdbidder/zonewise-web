import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-800 bg-[#020617] py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#1E3A5F] text-[#F59E0B] font-bold text-xs" aria-hidden="true">ZW</div>
            <span className="text-sm text-slate-300">ZoneWise.AI — by Everest Capital USA</span>
          </div>
          <nav aria-label="Footer navigation">
            <div className="flex items-center gap-1 text-sm text-slate-300">
              <Link href="/privacy" className="px-3 py-2 hover:text-white transition-colors rounded min-h-[44px] flex items-center">Privacy</Link>
              <Link href="/terms" className="px-3 py-2 hover:text-white transition-colors rounded min-h-[44px] flex items-center">Terms</Link>
              <Link href="/disclaimer" className="px-3 py-2 hover:text-white transition-colors rounded min-h-[44px] flex items-center">Disclaimer</Link>
              <Link href="/docs" className="px-3 py-2 hover:text-white transition-colors rounded min-h-[44px] flex items-center">Docs</Link>
            </div>
          </nav>
          <p className="text-xs text-slate-400">© 2026 Everest Capital USA LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
