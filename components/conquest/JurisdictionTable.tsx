import { type JurisdictionStat } from '@/lib/conquest'

interface JurisdictionTableProps {
  jurisdictions: JurisdictionStat[]
  totalZoned: number
}

const SOURCE_LABELS: Record<string, string> = {
  county_gis: 'County GIS',
  parcel_gis: 'Parcel GIS',
  municipal_gis: 'Municipal GIS',
  state_gis: 'State GIS',
  manual: 'Manual',
  unknown: 'Unknown',
}

function QualityBadge({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? count / total : 0
  if (pct >= 0.95) {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        PASS
      </span>
    )
  }
  if (pct >= 0.7) {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
        REVIEW
      </span>
    )
  }
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
      REJECT
    </span>
  )
}

export default function JurisdictionTable({ jurisdictions, totalZoned }: JurisdictionTableProps) {
  if (jurisdictions.length === 0) {
    return (
      <div className="text-slate-500 text-sm py-8 text-center">
        No jurisdiction data available.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-2 text-xs font-medium uppercase tracking-wider text-slate-400">
              Jurisdiction
            </th>
            <th className="text-right py-3 px-2 text-xs font-medium uppercase tracking-wider text-slate-400">
              Zoned Parcels
            </th>
            <th className="text-right py-3 px-2 text-xs font-medium uppercase tracking-wider text-slate-400 hidden sm:table-cell">
              Share
            </th>
            <th className="text-left py-3 px-2 text-xs font-medium uppercase tracking-wider text-slate-400 hidden md:table-cell">
              Sources
            </th>
            <th className="text-center py-3 px-2 text-xs font-medium uppercase tracking-wider text-slate-400">
              Quality
            </th>
          </tr>
        </thead>
        <tbody>
          {jurisdictions.map((j, i) => {
            const sharePct = totalZoned > 0 ? ((j.count / totalZoned) * 100).toFixed(1) : '0.0'
            return (
              <tr
                key={j.jurisdiction}
                className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                  i === 0 ? 'bg-white/[0.02]' : ''
                }`}
              >
                <td className="py-3 px-2 font-medium text-white">{j.jurisdiction}</td>
                <td className="py-3 px-2 text-right text-slate-300 tabular-nums font-mono text-xs">
                  {j.count.toLocaleString()}
                </td>
                <td className="py-3 px-2 text-right text-slate-500 tabular-nums text-xs hidden sm:table-cell">
                  {sharePct}%
                </td>
                <td className="py-3 px-2 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {j.zone_sources.slice(0, 3).map(s => (
                      <span
                        key={s.source}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/10"
                        title={`${s.count.toLocaleString()} parcels`}
                      >
                        {SOURCE_LABELS[s.source] ?? s.source}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-2 text-center">
                  <QualityBadge count={j.count} total={j.count} />
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-white/20">
            <td className="py-3 px-2 font-bold text-white">Total</td>
            <td className="py-3 px-2 text-right font-bold text-amber-400 tabular-nums font-mono text-xs">
              {totalZoned.toLocaleString()}
            </td>
            <td className="py-3 px-2 text-right text-slate-400 text-xs hidden sm:table-cell">100%</td>
            <td className="hidden md:table-cell" />
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
