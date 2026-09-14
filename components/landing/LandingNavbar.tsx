'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function LandingNavbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-[#0B1119]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0B1119]/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B2737] text-[#1A90FF] font-bold text-sm">
              ZW
            </div>
            <span className="font-semibold text-white">ZoneWise.AI</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <Link href="/explorer" className="hover:text-white transition-colors flex items-center min-h-11">Explorer</Link>
            <Link href="/pricing" className="hover:text-white transition-colors flex items-center min-h-11">Pricing</Link>
            <Link href="/docs" className="hover:text-white transition-colors flex items-center min-h-11">Docs</Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" asChild>
              <Link href="/sign-in" prefetch={false}>Sign in</Link>
            </Button>
            <Button
              size="sm"
              className="bg-[#1A90FF] text-slate-900 hover:bg-[#005EB8] font-semibold"
              asChild
            >
              <Link href="/sign-up" prefetch={false}>Start free</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
