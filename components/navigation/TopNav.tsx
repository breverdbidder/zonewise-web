'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/lib/theme-context'
import { UserButton, useUser } from '@clerk/nextjs'

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Auctions', href: '/auctions' },
  { name: 'Feasibility', href: '/feasibility' },
]

export default function TopNav() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const { user } = useUser()

  return (
    <nav className="h-12 flex items-center px-6 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
      <Link href="/" className="flex items-center gap-2 mr-8">
        <div className="w-6 h-6 rounded bg-gradient-to-br from-zw-navy-500 to-zw-navy-700 flex items-center justify-center">
          <span className="text-white text-xs font-bold">Z</span>
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          ZoneWise<span className="text-zw-orange-500">.AI</span>
        </span>
      </Link>

      <div className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'text-zw-navy-700 dark:text-zw-orange-400 bg-zw-navy-50 dark:bg-zw-navy-600/20'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              {item.name}
            </Link>
          )
        })}
      </div>

      {/* Right side — Clerk UserButton */}
      <div className="ml-auto flex items-center gap-3">
        {user && (
          <span className="hidden sm:block text-xs text-gray-500 dark:text-slate-400 max-w-[160px] truncate">
            {user.primaryEmailAddress?.emailAddress}
          </span>
        )}
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: 'w-7 h-7',
            },
          }}
        />
      </div>
    </nav>
  )
}
