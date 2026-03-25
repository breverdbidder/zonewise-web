'use client'

import { useEffect, useRef } from 'react'
import { X, ExternalLink, Home, User, DollarSign, MapPin, FileText, Building2 } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface BcpaoPropertyData extends Record<string, unknown> {
  // Identity
  TaxAcct?: string | number | null
  PARCEL_ID?: string | null
  photoUrl?: string | null

  // Address
  STREET_NUMBER?: string | number | null
  STREET_DIRECTION_PREFIX?: string | null
  STREET_NAME?: string | null
  STREET_TYPE?: string | null
  CITY?: string | null
  STATE?: string | null
  ZIP?: string | null
  ZIP_CODE?: string | null

  // Owner
  OWNER_NAME1?: string | null
  OWNER_NAME2?: string | null
  OWNER_STREET_NAME?: string | null
  OWNER_CITY?: string | null
  OWNER_STATE?: string | null
  OWNER_ZIP5?: string | null

  // Valuation
  BLDG_VALUE?: number | null
  LAND_VALUE?: number | null
  HOMESTEAD_VALUE?: number | null
  OTHER_EXEMPTION_VALUE?: number | null

  // Property details
  ACRES?: number | null
  LIV_AREA?: number | null
  USE_CODE?: string | null
  USE_CODE_DESCRIPTION?: string | null
  SUBDIVISION_NAME?: string | null
  MILLAGE_CODE?: string | null
  EXEMPTION_CODE?: string | null

  // Legal
  LEGAL_DESC?: string | null
  PLAT_BOOK?: string | number | null
  PLAT_PAGE?: string | number | null
  TOWNSHIP?: string | number | null
  RANGE?: string | number | null
  SECTION?: string | number | null
  BLOCK?: string | null
  LOT?: string | null
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function currency(val: number | null | undefined): string {
  if (val == null) return '—'
  return '$' + Math.round(val).toLocaleString()
}

function sqft(val: number | null | undefined): string {
  if (val == null) return '—'
  return Math.round(val).toLocaleString() + ' sq ft'
}

function str(val: unknown): string {
  if (val == null || val === '') return '—'
  return String(val).trim()
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-[#1E3A5F]/60 border-b border-gray-200 dark:border-slate-700">
        <span className="text-[#F59E0B]">{icon}</span>
        <span className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">{title}</span>
      </div>
      <div className="px-4 py-3 space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-gray-500 dark:text-slate-400 shrink-0">{label}</span>
      <span className="text-gray-800 dark:text-slate-100 text-right break-all">{value}</span>
    </div>
  )
}

function ValueRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-gray-500 dark:text-slate-400 shrink-0">{label}</span>
      <span className={highlight ? 'text-[#F59E0B] font-semibold' : 'text-gray-800 dark:text-slate-100'}>{value}</span>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
interface PropertyCardProps {
  data: BcpaoPropertyData
  parcelId: string
  onClose: () => void
}

export default function PropertyCard({ data, parcelId, onClose }: PropertyCardProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll while modal open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const address = [
    data.STREET_NUMBER,
    data.STREET_DIRECTION_PREFIX,
    data.STREET_NAME,
    data.STREET_TYPE,
  ].filter(Boolean).join(' ')

  const cityLine = [data.CITY, data.STATE, data.ZIP ?? data.ZIP_CODE].filter(Boolean).join(', ')

  const taxAcct = data.TaxAcct ? String(data.TaxAcct) : null
  const displayParcelId = str(data.PARCEL_ID ?? parcelId)

  const bldgValue = typeof data.BLDG_VALUE === 'number' ? data.BLDG_VALUE : null
  const landValue = typeof data.LAND_VALUE === 'number' ? data.LAND_VALUE : null
  const totalValue = bldgValue != null && landValue != null ? bldgValue + landValue : null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backdropFilter: 'blur(6px)', background: 'rgba(2,6,23,0.75)' }}
      onClick={handleBackdropClick}
    >
      {/* Modal panel — slides up on mobile */}
      <div
        className="
          relative w-full sm:w-[560px] max-h-[92dvh] sm:max-h-[85dvh]
          bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-2xl
          rounded-t-2xl sm:rounded-2xl
          flex flex-col
          animate-slide-up
        "
        style={{ animation: 'slideUp 0.22s ease-out' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label="Close property card"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── Header ── */}
        <div className="shrink-0">
          {/* Photo */}
          {data.photoUrl ? (
            <div className="relative w-full h-44 sm:h-52 overflow-hidden rounded-t-2xl sm:rounded-t-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.photoUrl}
                alt={address || 'Property photo'}
                className="w-full h-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="w-full h-28 rounded-t-2xl bg-gradient-to-br from-[#1E3A5F] to-gray-300 dark:to-slate-800 flex items-center justify-center">
              <Home className="w-12 h-12 text-[#F59E0B]/40" />
            </div>
          )}

          {/* Address block */}
          <div className="px-4 pt-3 pb-3 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                  {address || 'Unknown Address'}
                </h2>
                {cityLine && (
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{cityLine}</p>
                )}
              </div>
              <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded-md bg-[#1E3A5F] text-[#F59E0B] text-xs font-mono font-semibold whitespace-nowrap">
                {displayParcelId}
              </span>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

          {/* Owner Info */}
          <Section icon={<User className="w-3.5 h-3.5" />} title="Owner">
            {data.OWNER_NAME1 && <Row label="Owner" value={str(data.OWNER_NAME1)} />}
            {data.OWNER_NAME2 && <Row label="" value={str(data.OWNER_NAME2)} />}
            {data.OWNER_STREET_NAME && (
              <Row
                label="Mailing"
                value={[data.OWNER_STREET_NAME, data.OWNER_CITY, data.OWNER_STATE, data.OWNER_ZIP5]
                  .filter(Boolean).join(', ')}
              />
            )}
          </Section>

          {/* Valuation */}
          <Section icon={<DollarSign className="w-3.5 h-3.5" />} title="Valuation">
            <ValueRow label="Building Value" value={currency(bldgValue)} />
            <ValueRow label="Land Value" value={currency(landValue)} />
            {totalValue != null && (
              <ValueRow label="Total Value" value={currency(totalValue)} highlight />
            )}
            {data.HOMESTEAD_VALUE != null && (
              <ValueRow label="Homestead Exemption" value={currency(data.HOMESTEAD_VALUE as number)} />
            )}
            {data.OTHER_EXEMPTION_VALUE != null && (
              <ValueRow label="Other Exemption" value={currency(data.OTHER_EXEMPTION_VALUE as number)} />
            )}
          </Section>

          {/* Property Details */}
          <Section icon={<Building2 className="w-3.5 h-3.5" />} title="Property Details">
            <Row label="Acres" value={data.ACRES != null ? String(data.ACRES) : '—'} />
            <Row label="Living Area" value={sqft(data.LIV_AREA as number | null)} />
            {data.USE_CODE && (
              <Row label="Use Code" value={`${str(data.USE_CODE)}${data.USE_CODE_DESCRIPTION ? ' — ' + str(data.USE_CODE_DESCRIPTION) : ''}`} />
            )}
            {data.SUBDIVISION_NAME && <Row label="Subdivision" value={str(data.SUBDIVISION_NAME)} />}
            {data.MILLAGE_CODE && <Row label="Millage Code" value={str(data.MILLAGE_CODE)} />}
            {data.EXEMPTION_CODE && <Row label="Exemption Code" value={str(data.EXEMPTION_CODE)} />}
          </Section>

          {/* Legal */}
          <Section icon={<FileText className="w-3.5 h-3.5" />} title="Legal">
            {data.LEGAL_DESC && <Row label="Legal Desc" value={str(data.LEGAL_DESC)} />}
            {(data.PLAT_BOOK || data.PLAT_PAGE) && (
              <Row label="Plat" value={`Book ${str(data.PLAT_BOOK)} / Page ${str(data.PLAT_PAGE)}`} />
            )}
            {(data.TOWNSHIP || data.RANGE || data.SECTION) && (
              <Row
                label="T/R/S"
                value={[
                  data.TOWNSHIP ? `T${str(data.TOWNSHIP)}` : null,
                  data.RANGE ? `R${str(data.RANGE)}` : null,
                  data.SECTION ? `S${str(data.SECTION)}` : null,
                ].filter(Boolean).join(' ')}
              />
            )}
            {(data.BLOCK || data.LOT) && (
              <Row label="Block / Lot" value={`${str(data.BLOCK)} / ${str(data.LOT)}`} />
            )}
          </Section>

          {/* Links */}
          <div className="flex gap-2 pt-1 pb-2">
            {taxAcct && (
              <a
                href={`https://www.bcpao.us/PropertySearch/#/parcel/${taxAcct}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1E3A5F] hover:bg-[#1E3A5F]/80 text-white text-xs font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View on BCPAO
              </a>
            )}
            <a
              href={`/massing?parcel=${encodeURIComponent(parcelId)}`}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#F59E0B]/80 text-white text-xs font-medium transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              View 3D Massing
            </a>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(32px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
