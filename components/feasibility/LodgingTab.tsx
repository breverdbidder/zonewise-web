'use client'

import type { SiteData, LodgingPermissions, LodgingPermitStatus, NearbyLodgingParcel } from '@/types/feasibility'
import { COLORS } from '@/lib/feasibility/constants'
import { Badge, Card, SectionLabel } from './ui'
import MapboxMap from './MapboxMap'

interface LodgingTabProps {
  site: SiteData
  lodging: LodgingPermissions
  nearbyLodging?: NearbyLodgingParcel[]
}

const LODGING_TYPES: { key: keyof Omit<LodgingPermissions, 'notes' | 'ordinanceRef'>; label: string; description: string }[] = [
  { key: 'hotel', label: 'Hotel', description: 'Full-service lodging with daily housekeeping, 6+ rooms' },
  { key: 'motel', label: 'Motel', description: 'Motor lodging, exterior corridor, direct parking access' },
  { key: 'vacation_rental', label: 'Vacation Rental', description: 'Whole-unit rental ≥30 days (VRBO / furnished lease)' },
  { key: 'str', label: 'Short-Term Rental (STR)', description: 'Airbnb-style rental <30 days; city license typically required' },
  { key: 'bnb', label: 'Bed & Breakfast', description: 'Owner-occupied with ≤10 guest rooms; breakfast included' },
]

const STATUS_CONFIG: Record<LodgingPermitStatus, { label: string; bg: string; text: string; border: string; icon: string }> = {
  permitted: {
    label: 'Permitted By Right',
    bg: '#F0FDF4',
    text: '#065F46',
    border: '#6EE7B7',
    icon: '✓',
  },
  conditional: {
    label: 'Conditional Use',
    bg: '#FFFBEB',
    text: '#92400E',
    border: '#FCD34D',
    icon: '⚡',
  },
  not_permitted: {
    label: 'Not Permitted',
    bg: '#FEF2F2',
    text: '#991B1B',
    border: '#FCA5A5',
    icon: '✗',
  },
  unknown: {
    label: 'Verify with Municipality',
    bg: '#F8FAFC',
    text: '#475569',
    border: '#CBD5E1',
    icon: '?',
  },
}

function PermitBadge({ status }: { status: LodgingPermitStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
    >
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}

export default function LodgingTab({ site, lodging, nearbyLodging = [] }: LodgingTabProps) {
  const permittedCount = LODGING_TYPES.filter((t) => lodging[t.key] === 'permitted').length
  const conditionalCount = LODGING_TYPES.filter((t) => lodging[t.key] === 'conditional').length
  const notPermittedCount = LODGING_TYPES.filter((t) => lodging[t.key] === 'not_permitted').length

  return (
    <div className="flex gap-5">
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center mb-4 gap-3">
          <div className="flex-1">
            <SectionLabel text="Lodging & STR Intelligence" />
            <div className="text-[13px] text-slate-500">
              {site.zone} · {site.zoneCity} · {site.county} County
            </div>
          </div>
          <Badge text="CP5" color={COLORS.accent} />
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            ['By Right', permittedCount, COLORS.success],
            ['Conditional', conditionalCount, COLORS.accent],
            ['Not Permitted', notPermittedCount, COLORS.danger],
          ].map(([label, count, color]) => (
            <div
              key={label as string}
              className="rounded-lg px-4 py-3 text-center"
              style={{ background: (color as string) + '10', border: `1px solid ${color as string}30` }}
            >
              <div className="text-2xl font-extrabold" style={{ color: color as string, fontFamily: "'JetBrains Mono', monospace" }}>
                {count as number}
              </div>
              <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: color as string }}>
                {label as string}
              </div>
            </div>
          ))}
        </div>

        {/* Permit Matrix */}
        <Card className="mb-4">
          <div className="px-5 py-3 border-b border-slate-100">
            <div className="text-[13px] font-bold text-slate-900">Lodging Use Matrix</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Based on {site.zone} zoning designation in {site.zoneCity}</div>
          </div>
          <div className="divide-y divide-slate-50">
            {LODGING_TYPES.map(({ key, label, description }) => {
              const status = lodging[key] as LodgingPermitStatus
              const cfg = STATUS_CONFIG[status]
              return (
                <div
                  key={key}
                  className="px-5 py-3.5 flex items-start gap-4"
                  style={{ background: status === 'not_permitted' ? '#FAFAFA' : 'transparent' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-slate-900 mb-0.5">{label}</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">{description}</div>
                  </div>
                  <div className="flex-shrink-0 pt-0.5">
                    <PermitBadge status={status} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Ordinance Notes */}
        {(lodging.notes || lodging.ordinanceRef) && (
          <div
            className="rounded-lg p-4 mb-4"
            style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}
          >
            <div className="text-[11px] font-bold text-amber-800 mb-1.5 uppercase tracking-wider">
              📋 Municipality Notes
            </div>
            {lodging.notes && (
              <div className="text-[12px] text-amber-900 leading-relaxed mb-1.5">{lodging.notes}</div>
            )}
            {lodging.ordinanceRef && (
              <div className="text-[11px] text-amber-700 font-mono">
                Ref: {lodging.ordinanceRef}
              </div>
            )}
          </div>
        )}

        {/* Conditional Use Note */}
        {conditionalCount > 0 && (
          <div
            className="rounded-lg p-4 mb-4"
            style={{ background: COLORS.brandLight, border: `1px solid ${COLORS.brand}30` }}
          >
            <div className="text-[11px] font-bold mb-1.5" style={{ color: COLORS.brandDark }}>
              💡 Conditional Use Path
            </div>
            <div className="text-[12px] text-slate-600 leading-relaxed">
              {conditionalCount} lodging type{conditionalCount > 1 ? 's' : ''} require a Conditional Use Permit (CUP).
              CUPs in {site.zoneCity} typically require: site plan review, public hearing, and 30–90 day approval timeline.
              Contact {site.zoneCity} Planning & Zoning at City Hall to initiate the application.
            </div>
          </div>
        )}

        {/* Nearby Lodging Comps */}
        {nearbyLodging.length > 0 && (
          <div>
            <div className="text-[13px] font-bold mb-2.5 flex items-center">
              Comparable Lodging Nearby
              <Badge text={`${nearbyLodging.length} within 1.5mi`} color={COLORS.info} />
            </div>
            <Card>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    {['Address', 'Zone', 'Type', 'Distance', 'Units'].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold text-slate-500 border-b-2 border-slate-200 text-[10px] uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nearbyLodging.map((p, i) => (
                    <tr key={p.address} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-3 py-2.5 text-slate-700 font-medium">{p.address}</td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">{p.zone}</span>
                      </td>
                      <td className="px-3 py-2.5 capitalize text-slate-600">{p.type}</td>
                      <td className="px-3 py-2.5 text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {p.distanceMi.toFixed(1)} mi
                      </td>
                      <td className="px-3 py-2.5 text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {p.units ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-[300px] flex-shrink-0">
        <SectionLabel text="Subject Property" />
        <div className="text-sm font-bold text-slate-900 mb-3 leading-snug">{site.address}</div>
        <MapboxMap lat={site.lat} lng={site.lng} zoom={14} pitch={0} style={{ height: 200, marginBottom: 16 }} />

        <Card className="p-4">
          <SectionLabel text="Zoning Summary" />
          {[
            ['Zone', site.zone],
            ['Municipality', site.zoneCity],
            ['County', site.county],
            ['Flood Zone', site.flood],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1 text-xs border-b border-slate-50">
              <span className="text-slate-500">{k}</span>
              <span className="font-semibold text-slate-900">{v}</span>
            </div>
          ))}
        </Card>

        <div className="mt-4 rounded-lg p-3.5" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1.5">
            📊 Rental Income Potential
          </div>
          <div className="text-[12px] text-blue-900 leading-relaxed">
            {conditionalCount > 0 || permittedCount > 0
              ? `This parcel has lodging potential. ${permittedCount > 0 ? 'By-right uses can proceed without public hearing.' : 'CUP required — plan for 60–90 day approval process.'} Consider hotel feasibility study for highest-and-best-use analysis.`
              : 'Current zoning does not permit lodging. Rezoning or variance required. Discuss with municipality before pursuing lodging development.'}
          </div>
        </div>
      </div>
    </div>
  )
}
