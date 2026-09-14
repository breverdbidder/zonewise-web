import Link from 'next/link'
import { type CountyDetail, type FlRegion } from '@/lib/conquest'
import JurisdictionTable from './JurisdictionTable'

const REGION_LABELS: Record<FlRegion, string> = {
  panhandle: 'Panhandle',
  north: 'North',
  central: 'Central',
  south: 'South',
}

interface CountyDetailProps {
  detail: CountyDetail
}

function ConqueredView({ detail }: CountyDetailProps) {
  const { county, jurisdictions } = detail
  const totalZoned = jurisdictions.reduce((sum, j) => sum + j.count, 0) || county.zoned_parcels

  return (
    <div className="flex flex-col gap-8">
      {/* Hero stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-widest text-[rgb(var(--zw-ink2))]">Coverage</span>
          <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">100%</span>
          <span className="text-xs text-[rgb(var(--zw-ink2))]">Fully conquered</span>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-widest text-[rgb(var(--zw-ink2))]">Zoned Parcels</span>
          <span className="text-3xl font-bold text-[rgb(var(--zw-ink))] tabular-nums">
            {county.zoned_parcels.toLocaleString()}
          </span>
          <span className="text-xs text-[rgb(var(--zw-ink2))]">zoning_assignments</span>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-widest text-[rgb(var(--zw-ink2))]">Jurisdictions</span>
          <span className="text-3xl font-bold text-[rgb(var(--zw-ink))] tabular-nums">{jurisdictions.length || 17}</span>
          <span className="text-xs text-[rgb(var(--zw-ink2))]">municipalities</span>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-widest text-[rgb(var(--zw-ink2))]">Last Run</span>
          <span className="text-lg font-bold text-[rgb(var(--zw-ink))]">{county.last_run ?? '—'}</span>
          <span className="text-xs text-[rgb(var(--zw-ink2))]">pipeline date</span>
        </div>
      </div>

      {/* Jurisdiction table */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-[rgb(var(--zw-ink))]">Jurisdiction Breakdown</h2>
          <span className="text-xs text-[rgb(var(--zw-ink2))]">{jurisdictions.length} jurisdictions</span>
        </div>
        <JurisdictionTable jurisdictions={jurisdictions} totalZoned={totalZoned} />
      </div>
    </div>
  )
}

function PendingView({ detail }: CountyDetailProps) {
  const { county } = detail
  const cliCommand = `zonewise conquer --county ${county.slug} --source parcel_gis`

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8 text-center">
      <div className="w-20 h-20 rounded-full border-2 border-amber-500/30 flex items-center justify-center">
        <span className="text-3xl">🏔️</span>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-[rgb(var(--zw-ink))]">Ready to Conquer</h2>
        <p className="text-[rgb(var(--zw-ink2))] max-w-md">
          {county.name} County has ~{(county.total_parcels / 1000).toFixed(0)}K parcels waiting to be
          zoned. Run the pipeline to start conquering.
        </p>
      </div>

      {/* CLI command */}
      <div className="w-full max-w-lg rounded-xl border border-amber-500/30 bg-amber-950/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">CLI Command</span>
        </div>
        <code className="text-sm font-mono text-amber-700 dark:text-amber-300/90 break-all">{cliCommand}</code>
      </div>

      {/* County stats */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-[rgb(var(--zw-ink))] tabular-nums">
            ~{(county.total_parcels / 1000).toFixed(0)}K
          </div>
          <div className="text-xs text-[rgb(var(--zw-ink2))] mt-1">Est. Parcels</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-[rgb(var(--zw-ink))]">
            {REGION_LABELS[county.region]}
          </div>
          <div className="text-xs text-[rgb(var(--zw-ink2))] mt-1">Region</div>
        </div>
      </div>
    </div>
  )
}

export default function CountyDetailComponent({ detail }: CountyDetailProps) {
  const { county } = detail
  const isConquered = county.conquered

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/conquest"
          className="text-[rgb(var(--zw-ink2))] hover:text-[rgb(var(--zw-ink))] transition-colors text-sm flex items-center gap-1.5"
        >
          ← Back
        </Link>
        <span className="text-[rgb(var(--zw-ink))]">/</span>
        <span className="text-[rgb(var(--zw-ink2))] text-sm">Conquest</span>
        <span className="text-[rgb(var(--zw-ink))]">/</span>
        <span className="text-[rgb(var(--zw-ink))] text-sm font-medium">{county.name}</span>
      </div>

      {/* County title */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[rgb(var(--zw-ink))]">{county.name} County</h1>
          <p className="text-[rgb(var(--zw-ink2))] mt-1">
            DOR #{String(county.dor_number).padStart(2, '0')} · FIPS {county.fips} ·{' '}
            {REGION_LABELS[county.region]} Florida
          </p>
        </div>
        {isConquered ? (
          <span className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 font-bold text-sm">
            ✓ CONQUERED
          </span>
        ) : (
          <span className="px-4 py-2 rounded-xl bg-[rgb(var(--zw-card))] text-[rgb(var(--zw-ink2))] border border-white/10 font-bold text-sm">
            PENDING
          </span>
        )}
      </div>

      {/* Detail content */}
      {isConquered ? (
        <ConqueredView detail={detail} />
      ) : (
        <PendingView detail={detail} />
      )}
    </div>
  )
}
