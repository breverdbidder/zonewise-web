'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, MapPin, X } from 'lucide-react'

/**
 * Address search for /feasibility.
 *
 * The page already accepted ?parcel_id= and loaded live data, but there was no
 * way for a user to enter their own address — it always fell back to the demo
 * parcel. This is that entry point.
 *
 * Every result shows its zoning trust level, so a user sees provenance before
 * they commit to an analysis rather than after.
 *
 * Brightened + made prominent Aug 16 2026 (Ariel): thicker amber-accent
 * border with a glow so the bar reads as the primary action instead of
 * blending into the dark surface, always-white input text (was
 * text-slate-900 with a dark: variant that never reliably applied on this
 * always-dark section), larger type, and a brighter placeholder/menu text.
 */

interface Result {
  parcel_id: string
  address: string
  city: string
  zip: string
  county: string
  zone_code: string | null
  jurisdiction: string | null
  trust_level: 'verified' | 'estimated' | 'unverified' | 'none'
  just_value: number | null
}

const TRUST: Record<string, { label: string; color: string; bg: string }> = {
  verified:   { label: 'Verified',   color: '#10B981', bg: 'rgba(16,185,129,.12)' },
  estimated:  { label: 'Estimated',  color: '#F59E0B', bg: 'rgba(245,158,11,.12)' },
  unverified: { label: 'Unverified', color: '#94A3B8', bg: 'rgba(100,116,139,.15)' },
  none:       { label: 'No zoning',  color: '#64748B', bg: 'rgba(100,116,139,.12)' },
}

export function ParcelSearchBar({ currentAddress }: { currentAddress?: string }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const run = useCallback(async (term: string) => {
    if (term.trim().length < 3) {
      setResults([]); setHint(null); setLoading(false); return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/parcels/search?q=${encodeURIComponent(term)}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setHint(data.hint ?? null)
      setOpen(true)
    } catch {
      setResults([]); setHint('Search unavailable. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  function onChange(v: string) {
    setQ(v)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => run(v), 320)
  }

  function select(r: Result) {
    setOpen(false)
    setQ(r.address)
    router.push(`/feasibility?parcel_id=${encodeURIComponent(r.parcel_id)}`)
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#F59E0B]" />
        <input
          value={q}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={currentAddress ? `Analyze another address…` : 'Enter a Florida address, e.g. 1390 KANAB AVE'}
          className="w-full rounded-lg border-2 py-3 pl-11 pr-10 text-base font-medium text-white placeholder:text-slate-300 outline-none transition-all focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/40"
          style={{ background: 'rgba(15,23,42,.65)', borderColor: 'rgba(245,158,11,.55)', boxShadow: '0 0 0 1px rgba(245,158,11,.12), 0 2px 12px rgba(245,158,11,.08)' }}
          aria-label="Search Florida parcels by address"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#F59E0B]" />}
        {!loading && q && (
          <button onClick={() => { setQ(''); setResults([]); setOpen(false) }}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (results.length > 0 || hint) && (
        <div className="absolute z-[60] mt-2 w-full overflow-hidden rounded-lg border shadow-2xl"
             style={{ background: '#0d1829', borderColor: 'rgba(245,158,11,.35)' }}>
          {results.map((r) => {
            const t = TRUST[r.trust_level] ?? TRUST.none
            return (
              <button
                key={r.parcel_id}
                onClick={() => select(r)}
                className="flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-white/5"
                style={{ borderColor: 'rgba(30,41,59,.6)' }}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#F59E0B]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{r.address}</span>
                  <span className="block truncate text-xs text-slate-300">
                    {r.city}, FL {r.zip} · {r.county} County
                    {r.just_value ? ` · $${Number(r.just_value).toLocaleString()}` : ''}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  {r.zone_code && (
                    <span className="font-mono text-xs font-semibold text-white">{r.zone_code}</span>
                  )}
                  <span className="rounded px-1.5 py-0.5 font-mono text-[9.5px] font-bold"
                        style={{ color: t.color, background: t.bg }}>
                    {t.label}
                  </span>
                </span>
              </button>
            )
          })}
          {hint && <div className="px-4 py-3 text-xs text-slate-300">{hint}</div>}
        </div>
      )}
    </div>
  )
}
