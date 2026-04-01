import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-800 bg-[#020617] py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#1E3A5F] text-[#F59E0B] font-bold text-xs">ZW</div>
            <span className="text-sm text-slate-400">ZoneWise.AI — by Everest Capital USA</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link href="/disclaimer" className="hover:text-slate-300 transition-colors">Disclaimer</Link>
            <Link href="/docs" className="hover:text-slate-300 transition-colors">Docs</Link>
          </div>
          <p className="text-xs text-slate-600">© 2026 Everest Capital USA LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
