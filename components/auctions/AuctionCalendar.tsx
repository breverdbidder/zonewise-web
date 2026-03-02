'use client'

import { useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import type { Auction } from '@/types/auctions'

interface Props {
  auctions: Auction[]
  loading: boolean
  onSelectAuction: (auction: Auction) => void
}

function getEventColor(type: string): { backgroundColor: string; borderColor: string } {
  switch (type) {
    case 'foreclosure':
      return { backgroundColor: '#EF4444', borderColor: '#DC2626' }
    case 'tax_deed':
      return { backgroundColor: '#F59E0B', borderColor: '#D97706' }
    default:
      return { backgroundColor: '#3B82F6', borderColor: '#2563EB' }
  }
}

export default function AuctionCalendar({ auctions, loading, onSelectAuction }: Props) {
  const events = useMemo(() => {
    return auctions
      .filter(a => a.auction_date)
      .map(a => {
        const colors = getEventColor(a.auction_type)
        return {
          id: String(a.id),
          title: `${a.county} - ${a.case_number}`,
          start: a.auction_date!,
          ...colors,
          extendedProps: { auction: a },
        }
      })
  }, [auctions])

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zw-navy-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-gray-500 dark:text-slate-400">Foreclosure</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-xs text-gray-500 dark:text-slate-400">Tax Deed</span>
        </div>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,listWeek',
        }}
        events={events}
        eventClick={(info) => {
          const auction = info.event.extendedProps.auction as Auction
          onSelectAuction(auction)
        }}
        height="auto"
        dayMaxEvents={3}
        eventDisplay="block"
      />
    </div>
  )
}
