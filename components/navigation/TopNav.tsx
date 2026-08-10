'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { useSafeUser, SafeUserButton } from '@/lib/safe-clerk'

interface NavItem { name: string; href: string; highlight?: boolean }

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Explorer', href: '/explorer' },
  { name: 'Dev Intel', href: '/explore' },
  { name: 'Auctions', href: '/auctions' },
  { name: 'Feasibility', href: '/feasibility' },
  { name: 'Massing', href: '/massing' },
  { name: 'Floor Plan', href: '/floorplan' },
  { name: 'AI Chat', href: '/chat', highlight: true },
]

export default function TopNav() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const { user } = useSafeUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
      {/* Desktop + mobile top bar */}
      <div className="h-12 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2 mr-8">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-zw-navy-500 to-zw-navy-700 flex items-center justify-center">
            <span className="text-white text-xs font-bold">Z</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            ZoneWise<span className="text-zw-orange-500">.AI</span>
          </span>
        </Link>

        {/* Desktop nav links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isActive && item.highlight
                    ? 'text-white bg-[#F59E0B]'
                    : isActive
                    ? 'text-zw-navy-700 dark:text-zw-orange-400 bg-zw-navy-50 dark:bg-zw-navy-600/20'
                    : item.highlight
                    ? 'text-[#F59E0B]/80 hover:text-[#F59E0B] hover:bg-[#F59E0B]/10'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          {user && (
            <span className="hidden sm:block text-xs text-gray-400 dark:text-slate-400">
              {user.firstName || user.emailAddresses?.[0]?.emailAddress}
            </span>
          )}
          <SafeUserButton />
          {/* Hamburger — visible only on mobile */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-[#1E3A5F] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile slide-down nav menu */}
      {mobileOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden bg-[#1E3A5F] border-t border-slate-700"
        >
          <div className="flex flex-col py-2 px-4 gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    isActive && item.highlight
                      ? 'text-white bg-[#F59E0B]'
                      : isActive
                      ? 'text-white bg-white/10'
                      : item.highlight
                      ? 'text-[#F59E0B] hover:bg-white/10'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
