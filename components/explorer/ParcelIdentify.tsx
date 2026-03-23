'use client'

// ParcelIdentify.tsx — Parcel detail card shown when a parcel is clicked
// Renders as an overlay panel (bottom-left on desktop, inside bottom sheet on mobile)

import { formatAddress, formatCurrency, type ParcelAttributes } from '@/lib/explorer/constants'

interface Props {
  parcel: ParcelAttributes
  onClose?: () => void
}

export default function ParcelIdentify({ parcel, onClose }: Props) {
  const addr = formatAddress(parcel)
  const pid = parcel.PARCEL_ID || ''
  const pidEnc = encodeURIComponent(pid)

  return (
    <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-3 shadow-xl w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white leading-tight truncate">
            {addr || 'Unknown Address'}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {(parcel.CITY || '').trim()}, FL {parcel.ZIP_CODE || ''}
          </p>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
            {pid} · {(parcel.USE_CODE_DESCRIPTION || '').trim()}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-300 text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        {[
          { label: 'Building', value: formatCurrency(parcel.BLDG_VALUE) },
          { label: 'Land',     value: formatCurrency(parcel.LAND_VALUE) },
          { label: 'Living',   value: `${parseInt(parcel.LIV_AREA) || '—'} sqft` },
          { label: 'Lot',      value: `${parseFloat(parcel.ACRES)?.toFixed(2) || '—'} ac` },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-md p-2">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">{s.label}</div>
            <div className="text-xs font-bold text-white font-mono mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Owner */}
      <div className="bg-slate-900 border border-slate-800 rounded-md px-2.5 py-2 mb-2">
        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Owner</div>
        <div className="text-xs font-semibold text-white truncate">{parcel.OWNER_NAME1 || '—'}</div>
        {parcel.OWNER_NAME2 && (
          <div className="text-[10px] text-slate-400 truncate">{parcel.OWNER_NAME2}</div>
        )}
      </div>

      {/* CTAs */}
      <div className="space-y-1.5">
        <a
          href={`/parcel/${pidEnc}`}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-bold hover:bg-amber-500/25 transition-colors min-h-[44px]"
        >
          🗺️ ZoneWise.AI Full Analysis
        </a>
        <a
          href={`https://www.bcpao.us/PropertySearch/#/account/${parcel.PROPERTY_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[11px] font-semibold hover:bg-blue-500/20 transition-colors min-h-[44px]"
        >
          📋 View on BCPAO
        </a>
      </div>
    </div>
  )
}
