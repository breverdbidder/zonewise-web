interface StatCardProps {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}

function StatCard({ label, value, sub, highlight }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-5 flex flex-col gap-1 ${
        highlight
          ? 'border-amber-500/40 bg-amber-500/5'
          : 'border-white/10 bg-white/5'
      }`}
    >
      <span className="text-xs font-medium uppercase tracking-widest text-slate-400">{label}</span>
      <span
        className={`text-3xl font-bold tabular-nums ${
          highlight ? 'text-amber-400' : 'text-white'
        }`}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </div>
  )
}

interface StatsRowProps {
  totalCounties: number
  totalParcels: number
  countiesConquered: number
  totalZoned: number
}

export default function StatsRow({
  totalCounties,
  totalParcels,
  countiesConquered,
  totalZoned,
}: StatsRowProps) {
  const coveragePct = ((totalZoned / totalParcels) * 100).toFixed(1)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="FL Counties"
        value={totalCounties.toString()}
        sub="67 total in Florida"
      />
      <StatCard
        label="Conquered"
        value={countiesConquered.toString()}
        sub={`of ${totalCounties} counties`}
        highlight
      />
      <StatCard
        label="Parcels Zoned"
        value={totalZoned.toLocaleString()}
        sub="zoning_assignments records"
      />
      <StatCard
        label="Statewide Coverage"
        value={`${coveragePct}%`}
        sub={`${(totalParcels / 1_000_000).toFixed(1)}M FL parcels total`}
      />
    </div>
  )
}
