'use client'

import { useCallback, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'

/**
 * AuctionRadar calendar.
 *
 * Previously this component received a page of rows as a prop and mapped them
 * to events. The parent fetched /api/auctions with no date filter, and that
 * route sorted auction_date DESC, so the 200 rows it held were the farthest
 * FUTURE auctions (2027). The calendar opened on the current month, found none
 * of them in view, and rendered an empty grid - with 2,157 real auctions in
 * the next 45 days sitting in the table.
 *
 * It now owns its own data: on every view change it asks
 * /api/auctions/calendar for per-day typed COUNTS over exactly the visible
 * range, and renders them as badges (PropertyOnion-style: "23 Foreclosures"),
 * not as one event per property. Clicking a badge drills into that day's list.
 *
 * Colour is keyed on sale_type, never auction_type - auction_type is NULL on
 * 12,959 rows, which is why every event used to render in the fallback colour.
 */

interface DayCounts {
  date: string
  foreclosure_count: number
  tax_deed_count: number
  other_count: number
  total: number
}

interface Totals {
  foreclosure_count: number
  tax_deed_count: number
  other_count: number
  total: number
  days_with_auctions: number
}

interface Props {
  county?: string
  saleType?: string
  onSelectDay?: (date: string, saleType?: string) => void
}

const TYPE_STYLE: Record<string, { bg: string; border: string; label: string }> = {
  foreclosure: { bg: '#EF4444', border: '#DC2626', label: 'Foreclosures' },
  tax_deed: { bg: '#F59E0B', border: '#D97706', label: 'Tax Deeds' },
  other: { bg: '#3B82F6', border: '#2563EB', label: 'Other' },
}

function plural(n: number, label: string) {
  return n === 1 ? `${n} ${label.replace(/s$/, '')}` : `${n} ${label}`
}

export default function AuctionCalendar({ county, saleType, onSelectDay }: Props) {
  const [days, setDays] = useState<DayCounts[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const loadRange = useCallback(
    async (from: string, to: string) => {
      const id = ++requestId.current
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ from, to })
        if (county) params.set('county', county)
        if (saleType) params.set('sale_type', saleType)

        const res = await fetch(`/api/auctions/calendar?${params}`)
        if (!res.ok) throw new Error(`calendar request failed (${res.status})`)
        const json = await res.json()
        // Ignore a response that a later view change has already superseded.
        if (id !== requestId.current) return
        setDays(json.days || [])
        setTotals(json.totals || null)
      } catch (err) {
        if (id !== requestId.current) return
        console.error('Failed to fetch calendar counts:', err)
        setError('Could not load auction counts for this range.')
        setDays([])
        setTotals(null)
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    },
    [county, saleType]
  )

  const handleDatesSet = useCallback(
    (arg: { startStr: string; end: Date }) => {
      const from = arg.startStr.slice(0, 10)
      // FullCalendar's range end is exclusive; step back one day.
      const end = new Date(arg.end.getTime() - 86400000)
      const to = end.toISOString().slice(0, 10)
      loadRange(from, to)
    },
    [loadRange]
  )

  const events = days.flatMap((d) => {
    const parts: { type: string; count: number }[] = [
      { type: 'foreclosure', count: d.foreclosure_count },
      { type: 'tax_deed', count: d.tax_deed_count },
      { type: 'other', count: d.other_count },
    ]
    return parts
      .filter((p) => p.count > 0)
      .map((p) => {
        const style = TYPE_STYLE[p.type]
        return {
          id: `${d.date}:${p.type}`,
          title: plural(p.count, style.label),
          start: d.date,
          allDay: true,
          backgroundColor: style.bg,
          borderColor: style.border,
          extendedProps: { date: d.date, saleType: p.type, count: p.count },
        }
      })
  })

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-gray-500 dark:text-slate-400">Foreclosure</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-xs text-gray-500 dark:text-slate-400">Tax Deed</span>
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs">
          {loading && (
            <span className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
              <span className="w-3 h-3 border-2 border-zw-navy-500 border-t-transparent rounded-full animate-spin" />
              Loading counts...
            </span>
          )}
          {!loading && totals && (
            <span className="text-gray-600 dark:text-slate-300">
              <span className="font-semibold text-gray-900 dark:text-white">
                {totals.total.toLocaleString()}
              </span>{' '}
              {totals.total === 1 ? 'property' : 'properties'} across{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {totals.days_with_auctions}
              </span>{' '}
              {totals.days_with_auctions === 1 ? 'auction day' : 'auction days'} in view
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && totals?.total === 0 && (
        <div className="mb-4 px-3 py-2 rounded-md bg-gray-50 dark:bg-slate-800 text-xs text-gray-500 dark:text-slate-400">
          No auctions scheduled in this range
          {county ? ` for ${county}` : ''}. Try another month or clear the filters.
        </div>
      )}

      <FullCalendar
        plugins={[dayGridPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,listWeek',
        }}
        /*
         * buttonIcons={false} is deliberate and must not be reverted.
         *
         * FullCalendar draws prev/next with an embedded `data:` icon font.
         * middleware.ts sets `font-src 'self' https://fonts.gstatic.com` with no
         * `data:` allowance, so the browser blocks that font and both arrows
         * paint as empty dark rectangles - which is why month navigation looked
         * broken even though the buttons were live and datesSet was refetching
         * correctly the whole time. Text labels sidestep the block entirely
         * without loosening CSP site-wide for a glyph.
         *
         * The range is intentionally open in both directions: the table holds
         * auctions back to 2017-04-10, and scrolling into past months is how a
         * bidder reads sale history. Do not add validRange.
         */
        buttonIcons={false}
        buttonText={{
          prev: '‹ Prev',
          next: 'Next ›',
          today: 'Today',
          month: 'Month',
          list: 'List',
        }}
        events={events}
        datesSet={handleDatesSet}
        eventClick={(info) => {
          const { date, saleType: type } = info.event.extendedProps as {
            date: string
            saleType: string
          }
          onSelectDay?.(date, type === 'other' ? undefined : type)
        }}
        height="auto"
        dayMaxEvents={3}
        eventDisplay="block"
      />
    </div>
  )
}
