'use client'

import { useEffect, useState } from 'react'

interface PropZoneRow {
  field: string
  zonewise: string | null
  propzone: string | null
}

interface PropZoneIntel {
  parcel_id: string
  address: string | null
  zoning_code: string | null
  permitted_uses: string | null
  front_setback_ft: number | null
  side_setback_ft: number | null
  rear_setback_ft: number | null
  max_height_ft: number | null
  far: number | null
  density: number | null
  lot_coverage_pct: number | null
  scraped_at: string | null
}

interface ZonewiseData {
  zone_code: string | null
  permitted_uses: string | null
  front_setback_ft: number | null
  side_setback_ft: number | null
  rear_setback_ft: number | null
  max_height_ft: number | null
  far: number | null
  density: number | null
  lot_coverage_pct: number | null
}

interface Props {
  parcelId: string
  zonewise?: ZonewiseData | null
}

function fmt(val: string | number | null, suffix = ''): string {
  if (val === null || val === undefined || val === '') return '—'
  return `${val}${suffix}`
}

function advantage(zw: string | null, pz: string | null): 'zw' | 'pz' | 'tie' | 'none' {
  if (zw && !pz) return 'zw'
  if (pz && !zw) return 'pz'
  if (!zw && !pz) return 'none'
  return 'tie'
}

export default function PropZoneCompare({ parcelId, zonewise }: Props) {
  const [intel, setIntel] = useState<PropZoneIntel | null>(null)
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)

  useEffect(() => {
    setLoading(true)
    setEmpty(false)
    setIntel(null)

    fetch(`/api/explorer/propzone-intel?parcelId=${encodeURIComponent(parcelId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || data.error) { setEmpty(true) } else { setIntel(data) }
        setLoading(false)
      })
      .catch(() => { setEmpty(true); setLoading(false) })
  }, [parcelId])

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="text-xs text-[rgb(var(--zw-ink2))] animate-pulse">Loading competitor data...</div>
      </div>
    )
  }

  if (empty || !intel) {
    return (
      <div className="p-4 rounded-lg bg-[rgb(var(--zw-page))] border border-[rgb(var(--zw-border2))] text-center">
        <div className="text-[rgb(var(--zw-ink2))] text-xs leading-relaxed">
          Competitor data collection in progress for this parcel.
          <br />
          <span className="text-[rgb(var(--zw-ink2))] text-[10px]">
            PropZone scrape pipeline runs weekly. Check back soon.
          </span>
        </div>
      </div>
    )
  }

  // Build comparison rows
  const rows: PropZoneRow[] = [
    {
      field: 'Zoning Code',
      zonewise: fmt(zonewise?.zone_code),
      propzone: fmt(intel.zoning_code),
    },
    {
      field: 'Permitted Uses',
      zonewise: zonewise?.permitted_uses ? 'Available' : null,
      propzone: intel.permitted_uses ? 'Available' : null,
    },
    {
      field: 'Front Setback',
      zonewise: fmt(zonewise?.front_setback_ft, ' ft'),
      propzone: fmt(intel.front_setback_ft, ' ft'),
    },
    {
      field: 'Side Setback',
      zonewise: fmt(zonewise?.side_setback_ft, ' ft'),
      propzone: fmt(intel.side_setback_ft, ' ft'),
    },
    {
      field: 'Rear Setback',
      zonewise: fmt(zonewise?.rear_setback_ft, ' ft'),
      propzone: fmt(intel.rear_setback_ft, ' ft'),
    },
    {
      field: 'Height Limit',
      zonewise: fmt(zonewise?.max_height_ft, ' ft'),
      propzone: fmt(intel.max_height_ft, ' ft'),
    },
    {
      field: 'FAR',
      zonewise: fmt(zonewise?.far),
      propzone: fmt(intel.far),
    },
    {
      field: 'Density (du/ac)',
      zonewise: fmt(zonewise?.density),
      propzone: fmt(intel.density),
    },
    {
      field: 'Lot Coverage',
      zonewise: fmt(zonewise?.lot_coverage_pct, '%'),
      propzone: fmt(intel.lot_coverage_pct, '%'),
    },
  ]

  const zwAdvantages = rows.filter(r => advantage(r.zonewise === '—' ? null : r.zonewise, r.propzone === '—' ? null : r.propzone) === 'zw').length

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold text-[rgb(var(--zw-ink2))] uppercase tracking-wider">
          ZoneWise vs PropZone
        </h3>
        <div className="text-[10px] text-[rgb(var(--zw-ink2))]">
          Scraped {intel.scraped_at ? new Date(intel.scraped_at).toLocaleDateString() : 'unknown'}
        </div>
      </div>

      {/* Advantage summary */}
      {zwAdvantages > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <div className="text-[11px] text-amber-400 font-semibold">
            ZoneWise has more data on {zwAdvantages} field{zwAdvantages !== 1 ? 's' : ''} than PropZone
          </div>
        </div>
      )}

      {/* Comparison table */}
      <div className="overflow-x-auto rounded-lg border border-[rgb(var(--zw-border2))]">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-[rgb(var(--zw-border2))]">
              <th className="text-left px-3 py-2 text-[rgb(var(--zw-ink2))] font-semibold w-[35%]">Field</th>
              <th className="text-center px-2 py-2 text-[rgb(var(--zw-brand))] font-bold w-[25%]">ZoneWise</th>
              <th className="text-center px-2 py-2 text-[rgb(var(--zw-ink2))] font-semibold w-[25%]">PropZone</th>
              <th className="text-center px-2 py-2 text-[rgb(var(--zw-ink2))] font-semibold w-[15%]">Edge</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const zwVal = row.zonewise === '—' ? null : row.zonewise
              const pzVal = row.propzone === '—' ? null : row.propzone
              const adv = advantage(zwVal, pzVal)
              return (
                <tr
                  key={row.field}
                  className={`border-b border-[rgb(var(--zw-border2)/0.5)] ${i % 2 === 0 ? 'bg-[rgb(var(--zw-page)/0.4)]' : ''}`}
                >
                  <td className="px-3 py-2 text-[rgb(var(--zw-ink2))]">{row.field}</td>
                  <td className={`px-2 py-2 text-center font-mono font-semibold ${zwVal ? 'text-[rgb(var(--zw-ink))]' : 'text-[rgb(var(--zw-ink))]'}`}>
                    {row.zonewise}
                  </td>
                  <td className={`px-2 py-2 text-center font-mono ${pzVal ? 'text-[rgb(var(--zw-ink2))]' : 'text-[rgb(var(--zw-ink))]'}`}>
                    {row.propzone}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {adv === 'zw' && <span className="text-amber-400 font-bold">✓ ZW</span>}
                    {adv === 'pz' && <span className="text-[rgb(var(--zw-ink2))]">PZ</span>}
                    {adv === 'tie' && <span className="text-[rgb(var(--zw-ink2))]">—</span>}
                    {adv === 'none' && <span className="text-[rgb(var(--zw-ink))]">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[10px] text-[rgb(var(--zw-ink2))] leading-relaxed">
        PropZone data scraped via propzone-scrape pipeline. ZoneWise data sourced from BCPAO GIS + Supabase zoning_assignments.
      </div>
    </div>
  )
}
