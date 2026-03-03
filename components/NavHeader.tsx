'use client'

import { useState } from 'react'

export default function NavHeader() {
  const [open, setOpen] = useState(false)

  const links = [
    { href: '#how', label: 'How It Works' },
    { href: '/kpis', label: '298 KPIs' },
    { href: '/demo.html', label: '\u25B6 Live Demo' },
    { href: '#pricing', label: 'Pricing' },
    { href: '/login', label: 'Sign In' },
  ]

  return (
    <header className="border-b sticky top-0 bg-white/95 backdrop-blur z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zw-navy rounded-lg flex items-center justify-center relative">
            <span className="text-white font-bold">Z</span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-zw-orange rounded-full" />
          </div>
          <span className="text-xl font-bold text-slate-800">ZoneWise.AI</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              className={
                l.label === '\u25B6 Live Demo'
                  ? 'text-zw-navy font-semibold hover:text-zw-navy-700 text-sm border border-zw-navy/30 px-3 py-1 rounded-lg hover:bg-zw-navy/5 transition-all'
                  : l.label === 'Sign In'
                    ? 'text-gray-600 hover:text-slate-800 text-sm font-medium'
                    : 'text-gray-600 hover:text-slate-800 text-sm'
              }
            >
              {l.label}
            </a>
          ))}
          <a
            href="#beta-signup"
            className="bg-zw-navy text-white px-4 py-2 rounded-lg hover:bg-zw-navy-700 text-sm font-medium transition-colors"
          >
            Join the Beta
          </a>
        </nav>

        {/* Mobile: Join Beta + Hamburger */}
        <div className="flex sm:hidden items-center gap-3">
          <a
            href="#beta-signup"
            className="bg-zw-navy text-white px-3 py-1.5 rounded-lg text-sm font-medium"
          >
            Join the Beta
          </a>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {open ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="sm:hidden border-t bg-white px-4 py-3 flex flex-col gap-1">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-2.5 text-sm text-gray-700 hover:text-zw-navy font-medium border-b border-gray-100 last:border-0"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}
